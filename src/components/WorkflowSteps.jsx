import { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeID, toJakartaIsoFromLocal } from '../utils/time';

// Simple CSS icons as components
const CheckIcon = () => (
  <div className="w-4 h-4 text-white flex items-center justify-center">
    <div className="w-2 h-1 border-b-2 border-current transform rotate-45 origin-left"></div>
    <div className="w-3 h-1 border-b-2 border-current transform -rotate-45 origin-right -ml-1"></div>
  </div>
);

const ClockIcon = () => (
  <div className="w-4 h-4 border-2 border-current rounded-full relative">
    <div className="absolute top-1 left-1.5 w-1 h-1.5 bg-current"></div>
    <div className="absolute top-1.5 left-1.5 w-1.5 h-0.5 bg-current"></div>
  </div>
);

const WorkflowSteps = ({ requestId, currentStatus, requesterName, submittedAt, golonganLimbahId, golonganLimbahName, currentStepLevel, isProdukPangan }) => {
  const { user } = useAuth();
  // If the authenticated user is acting on behalf of someone else, AuthContext stores
  // the delegated target in `user.delegatedTo` (object with Nama and log_NIK fields).
  // We'll display "OriginalName a.n. DelegatedName" for actions performed while
  // delegated (a.n. = "atas nama").
  const delegated = user && user.delegatedTo ? user.delegatedTo : null;
  // workflows will hold { approvalSteps: [], verificationSteps: [] }
  const [workflows, setWorkflows] = useState({ approvalSteps: [], verificationSteps: [] });
  const [allWorkflows, setAllWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use centralized Jakarta formatter so displayed wall-clock matches stored +07:00 values
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // formatDateTimeID expects a Jakarta-local ISO-like string and will extract components
    return formatDateTimeID(timestamp);
  };

  // Key changes to the useEffect in your WorkflowSteps component:

  useEffect(() => {
      const fetchWorkflows = async () => {
          try {
              setLoading(true);
              // Fetch workflow steps for this specific request from backend
              const perRequestResponse = await dataAPI.getApprovalWorkflowByRequest(requestId);
              if (perRequestResponse.data && perRequestResponse.data.success) {
                  let steps = perRequestResponse.data.data || [];
                  steps = steps.sort((a, b) => (Number(a.step_level || 0) - Number(b.step_level || 0)));

                  const approvalSteps = [];
                  const verificationSteps = [];

                  // Submission step - completed when submittedAt exists
                  approvalSteps.push({
                      step: 'Diserahkan',
                      role: 'Pemohon',
                      person: requesterName || 'Unknown',
                      date: submittedAt ? formatTimestamp(submittedAt) : null,
                      status: submittedAt ? 'completed' : 'pending',
                      level: 0
                  });

          steps.forEach(step => {
            const stepLevel = step.step_level ?? step.stepLevel ?? null;
            const apprNo = step.Appr_No ?? step.appr_no ?? step.apprNo ?? stepLevel;

            // Use EXACT backend status and timestamp - no client-side logic needed
            const backendStatus = step.status ?? null;
            let status = 'pending';
            
            if (backendStatus === 'approved') {
                status = 'completed';
            } else if (backendStatus === 'rejected') {
                status = 'rejected';
            } else {
                // For pending steps, check if we're past this step based on current step level
                if (currentStatus === 'InProgress' && currentStepLevel && stepLevel < currentStepLevel) {
                    status = 'completed';
                } else if (currentStatus === 'Completed') {
                    status = 'completed';
                } else {
                    status = 'pending';
                }
            }

            // Use backend-provided approved_at timestamp directly
            const date = step.approved_at || null;

            // Use backend-provided approver name
            const person = step.approver_name || step.approver_id || null;

            let roleLabel = step.role_name ?? step.action_type ?? 'Menyetujui';
            
            // Special handling for APJ steps - distinguish between PN, QA, and HC/PJKPO
            if (stepLevel === 2 && (roleLabel.includes('APJ') || step.step_name?.includes('APJ') || step.step_name === 'PJKPO Approval')) {
              if (roleLabel.includes('PN') || (step.Appr_DeptID && step.Appr_DeptID.toUpperCase() === 'PN1')) {
                roleLabel = 'APJ PN';
              } else if (roleLabel.includes('QA') || (step.Appr_DeptID && step.Appr_DeptID.toUpperCase() === 'QA')) {
                roleLabel = 'APJ QA';
              } else if (step.step_name === 'PJKPO Approval' || roleLabel.includes('HC') || roleLabel.includes('PJKPO') ||
                         (step.Appr_DeptID && step.Appr_DeptID.toUpperCase() === 'HC')) {
                // PJKPO approval (HC department) - display as PJKPO
                roleLabel = 'PJKPO';
              }
            }
            
            // Role labeling for verification steps (same as before)
            if (Number(apprNo) === 3) {
                const apprDept = step.Appr_DeptID ?? step.appr_deptid ?? step.apprDeptId ?? null;
                const jobLevel = step.job_levelid ?? step.jobLevelId ?? step.Job_LevelID ?? null;

                const isHSE = typeof apprDept === 'string' && apprDept.toUpperCase() === 'KL';
                const isPemohon = !isHSE;

                if (Number(jobLevel) === 7) {
                    roleLabel = isHSE ? 'Pelaksana HSE' : (isPemohon ? 'Pelaksana Pemohon' : 'Pelaksana');
                } else if (Number(jobLevel) === 5 || Number(jobLevel) === 6) {
                    roleLabel = isHSE ? 'Supervisor/Officer HSE' : (isPemohon ? 'Supervisor/Officer Pemohon' : 'Supervisor/Officer');
                }
            }

            const isMengetahui = (step.action_type || '').toString().toLowerCase() === 'mengetahui';

            const stepObj = {
              step: step.action_type ?? step.role_name ?? roleLabel,
              role: roleLabel,
              person: person,
              date: date ? formatTimestamp(date) : null,
              status: status,
              level: stepLevel,
              apprNo: Number(apprNo),
              comments: step.comments || null,
              isMengetahui: isMengetahui
            };

            // Separate verification steps (level 3 or apprNo 3) or Mengetahui nodes
            if (Number(apprNo) === 3 || isMengetahui) {
              // If backend provided per-role verification details, expand them into 4 nodes
              if (Array.isArray(step.VerificationRoles) && step.VerificationRoles.length > 0) {
                step.VerificationRoles.forEach(vr => {
                  // Normalize role label to match UI conventions used elsewhere (roleLabel)
                  const key = (vr.key || '').toString().toLowerCase();
                  let vrRoleLabel = vr.title || vr.key || '';
                  if (key === 'pelaksana_pemohon') vrRoleLabel = 'Pelaksana Pemohon';
                  else if (key === 'supervisor_pemohon') vrRoleLabel = 'Supervisor/Officer Pemohon';
                  else if (key === 'pelaksana_hse') vrRoleLabel = 'Pelaksana HSE';
                  else if (key === 'supervisor_hse') vrRoleLabel = 'Supervisor/Officer HSE';

                  verificationSteps.push({
                    step: vr.title || `Verifikasi ${vr.id}`,
                    role: vrRoleLabel,
                    person: vr.approver_name || null,
                    date: vr.approved_at ? formatTimestamp(vr.approved_at) : null,
                    status: vr.approved ? 'completed' : 'pending',
                    level: stepLevel,
                    apprNo: Number(apprNo),
                    comments: step.comments || null
                  });
                });

                // If the overall verification step was rejected by someone (step.status === 'rejected'),
                // try to find which per-role node corresponds to the rejecting approver and mark that node
                // as 'rejected' (update person/date/comments). Matching order:
                // 1) match by approver name (exact / case-insensitive contains)
                // 2) match by role label equality (role/title)
                // If no matching node is found, fall back to appending a rejected node (backwards-compatible).
                if ((step.status || '').toString().toLowerCase() === 'rejected' && (step.approver_name || step.approver_id)) {
                  // First try: find the approver record in ApprovalWorkflowApprovers to infer role side (HSE vs Pemohon)
                  const approversList = Array.isArray(step.ApprovalWorkflowApprovers) ? step.ApprovalWorkflowApprovers : [];
                  const approverRecord = approversList.find(a => String(a.approver_id) === String(step.approver_id));

                  let inferredRoleLabel = null;
                  if (approverRecord) {
                    const dept = (approverRecord.approver_dept_id || '').toString().toUpperCase();
                    const cc = (approverRecord.approver_cc || approverRecord.approver_title || '').toString();
                    const ccLower = cc.toLowerCase();

                    const isHSE = dept === 'KL';
                    const isPemohon = !isHSE;
                    const isSupervisorLike = /supervisor|head|manager|officer/i.test(ccLower);

                    if (isHSE) {
                      inferredRoleLabel = isSupervisorLike ? 'Supervisor/Officer HSE' : 'Pelaksana HSE';
                    } else if (isPemohon) {
                      inferredRoleLabel = isSupervisorLike ? 'Supervisor/Officer Pemohon' : 'Pelaksana Pemohon';
                    }
                  }

                  // Find nodes we just pushed for this step level
                  const nodesForLevel = verificationSteps.filter(v => Number(v.level) === Number(stepLevel));
                  let matched = false;

                  // If we inferred a role label, try to match a node by that role label
                  if (inferredRoleLabel && nodesForLevel.length > 0) {
                    for (let i = 0; i < verificationSteps.length; i++) {
                      const node = verificationSteps[i];
                      if (Number(node.level) !== Number(stepLevel)) continue;
                      const nodeRole = (node.role || '').toString();
                      if (nodeRole === inferredRoleLabel || nodeRole.toLowerCase().includes(inferredRoleLabel.toLowerCase())) {
                        verificationSteps[i] = {
                          ...node,
                          status: 'rejected',
                          person: step.approver_name || step.approver_id || node.person,
                          date: step.approved_at ? formatTimestamp(step.approved_at) : node.date,
                          comments: step.comments || node.comments
                        };
                        matched = true;
                        break;
                      }
                    }
                  }

                  // If no match yet, try matching by name (existing tolerant matching)
                  if (!matched) {
                    const rejectingName = (step.approver_name || step.approver_id || '').toString().toLowerCase();
                    if (nodesForLevel.length > 0) {
                      for (let i = verificationSteps.length - 1; i >= 0; i--) {
                        const node = verificationSteps[i];
                        if (Number(node.level) !== Number(stepLevel)) continue;
                        const nodePerson = (node.person || '').toString().toLowerCase();
                        const nodeRole = (node.role || '').toString().toLowerCase();

                        if (rejectingName && nodePerson && (nodePerson === rejectingName || nodePerson.includes(rejectingName) || rejectingName.includes(nodePerson))) {
                          verificationSteps[i] = {
                            ...node,
                            status: 'rejected',
                            person: step.approver_name || step.approver_id || node.person,
                            date: step.approved_at ? formatTimestamp(step.approved_at) : node.date,
                            comments: step.comments || node.comments
                          };
                          matched = true;
                          break;
                        }
                      }
                    }
                  }

                  // Final fallback: try matching by step.role_name substring
                  if (!matched && step.role_name && nodesForLevel.length > 0) {
                    const roleName = step.role_name.toString().toLowerCase();
                    for (let i = 0; i < verificationSteps.length; i++) {
                      const node = verificationSteps[i];
                      if (Number(node.level) !== Number(stepLevel)) continue;
                      const nodeRole = (node.role || '').toString().toLowerCase();
                      if (nodeRole === roleName || nodeRole.includes(roleName) || roleName.includes(nodeRole)) {
                        verificationSteps[i] = {
                          ...node,
                          status: 'rejected',
                          person: step.approver_name || step.approver_id || node.person,
                          date: step.approved_at ? formatTimestamp(step.approved_at) : node.date,
                          comments: step.comments || node.comments
                        };
                        matched = true;
                        break;
                      }
                    }
                  }

                  if (!matched) {
                    // Fallback: append a rejected node so rejecting user remains visible
                    verificationSteps.push({
                      step: step.role_name || 'Verifikasi (Ditolak)',
                      role: step.role_name || 'Verifikasi',
                      person: step.approver_name || step.approver_id || null,
                      date: step.approved_at ? formatTimestamp(step.approved_at) : null,
                      status: 'rejected',
                      level: stepLevel,
                      apprNo: Number(apprNo),
                      comments: step.comments || null
                    });
                  }
                }
              } else {
                verificationSteps.push(stepObj);
              }
            } else {
              approvalSteps.push(stepObj);
            }
                  });

                  approvalSteps.sort((a, b) => (Number(a.level || 0) - Number(b.level || 0)));
                  verificationSteps.sort((a, b) => (Number(a.level || 0) - Number(b.level || 0)));

                  setWorkflows({ approvalSteps, verificationSteps });
              } else {
                  setWorkflows({ approvalSteps: [], verificationSteps: [] });
              }
          } catch (err) {
              console.error('Error fetching workflows:', err);
              setError('Failed to load workflow information');
              setWorkflows(buildFallbackWorkflow());
          } finally {
              setLoading(false);
          }
      };

      if (requestId) {
          fetchWorkflows();
      } else {
          setLoading(false);
      }
      
      // Add currentStatus and currentStepLevel as dependencies so the component updates when these change
  }, [requestId, currentStatus, requesterName, submittedAt, golonganLimbahName, currentStepLevel]);

  // Determine which workflow applies based on golongan limbah
  const getApplicableWorkflow = (allWorkflows) => {
    if (!golonganLimbahName || allWorkflows.length === 0) return null;

    const categoryName = golonganLimbahName.toLowerCase();
    
    if (categoryName.includes('prekursor') || categoryName.includes('oot')) {
      return allWorkflows.find(w => w.workflow_name.toLowerCase().includes('precursor'));
    } else if (categoryName.includes('recall')) {
      return allWorkflows.find(w => w.workflow_name.toLowerCase().includes('recall'));
    } else {
      return allWorkflows.find(w => w.workflow_name.toLowerCase().includes('standard'));
    }
  };

  // Build workflow steps based on the applicable workflow and current status
  // Returns an object with approvalSteps[] and verificationSteps[] (verification = level === 3)
  const buildWorkflowSteps = (applicableWorkflow) => {
    const approvalSteps = [];
    const verificationSteps = [];

    // Add submission step: only completed when submittedAt exists
    approvalSteps.push({
      step: "Diserahkan",
      role: "Pemohon",
      person: requesterName || "Unknown",
      date: submittedAt ? formatTimestamp(submittedAt) : null,
      status: submittedAt ? "completed" : "pending",
      level: 0
    });

    // Sort workflow steps by level (defensive: ensure numeric ascending order)
    const sortedSteps = applicableWorkflow.ApprovalWorkflowSteps
      ? [...applicableWorkflow.ApprovalWorkflowSteps].sort((a, b) => Number(a.step_level || 0) - Number(b.step_level || 0))
      : [];

    // Add approval and verification steps separately
    sortedSteps.forEach((stepDef) => {
      const stepLevel = stepDef.step_level;
      let stepStatus = "pending";

      if (currentStatus === "Draft") {
        stepStatus = "pending";
      } else if (currentStatus === "InProgress") {
        if (currentStepLevel && stepLevel < currentStepLevel) {
          stepStatus = "completed";
        } else if (currentStepLevel && stepLevel === currentStepLevel) {
          stepStatus = "pending";
        } else {
          stepStatus = "pending";
        }
      } else if (currentStatus === "Approved" || currentStatus === "Completed") {
        stepStatus = "completed";
      } else if (currentStatus === "Rejected") {
        if (currentStepLevel && stepLevel < currentStepLevel) {
          stepStatus = "completed";
        } else if (currentStepLevel && stepLevel === currentStepLevel) {
          stepStatus = "rejected";
        } else {
          stepStatus = "pending";
        }
      }

      // Use approver data exactly as provided by backend; no client-side department filtering
      let approverName = null;
      if (stepDef.ApprovalWorkflowApprovers && stepDef.ApprovalWorkflowApprovers.length > 0) {
        const first = stepDef.ApprovalWorkflowApprovers[0];
        approverName = first.approver_name || first.approver_id || null;
      }

      const stepObj = {
        step: stepDef.step_name || "Menyetujui",
        role: stepDef.step_name || "Manager",
        person: approverName,
        date: stepStatus === "completed" ? formatDateTimeID(toJakartaIsoFromLocal()) : null,
        status: stepStatus,
        level: stepLevel,
        approvers: stepDef.ApprovalWorkflowApprovers || [],
        isMengetahui: ((stepDef.action_type || '').toString().toLowerCase() === 'mengetahui') || (Number(stepLevel) === 4 && defDept === 'KL')
      };

      // Per external API: Appr_No === 3 is the Verifikasi Lapangan step
      // Also treat explicit 'Mengetahui' action (HSE/KL acknowledge) as its own verification-style node
      const isMengetahuiDef = (stepDef.action_type || '').toString().toLowerCase() === 'mengetahui';
      const defDept = (stepDef && stepDef.ApprovalWorkflowApprovers && stepDef.ApprovalWorkflowApprovers[0] && stepDef.ApprovalWorkflowApprovers[0].approver_dept_id) ? String(stepDef.ApprovalWorkflowApprovers[0].approver_dept_id).toUpperCase() : null;

      if (Number(stepLevel) === 3 || isMengetahuiDef || (Number(stepLevel) === 4 && defDept === 'KL')) {
        verificationSteps.push(stepObj);
      } else {
        approvalSteps.push(stepObj);
      }
    });

    return { approvalSteps, verificationSteps };
  };

  // Fallback workflow if no specific workflow found
  const buildFallbackWorkflow = () => {
    const approvalSteps = [
      {
        step: "Diserahkan",
        role: "Pemohon",
        person: requesterName || "Unknown",
        date: submittedAt ? formatTimestamp(submittedAt) : null,
        status: submittedAt ? "completed" : "pending",
        level: 0
      },
      {
        step: "Manager Approval",
        role: "Manager",
        person: "Manager Dept",
        date: null,
        status: "pending",
        level: 1
      },
      {
        step: "HSE Approval",
        role: "HSE",
        person: "HSE Team",
        date: null,
        status: "pending",
        level: 2
      }
    ];

    // Update status based on currentStepLevel if available
    if (currentStatus === "InProgress" && currentStepLevel) {
      approvalSteps.forEach(step => {
        if (step.level && step.level < currentStepLevel) {
          step.status = "completed";
          step.date = formatDateTimeID(toJakartaIsoFromLocal());
        } else if (step.level && step.level === currentStepLevel) {
          step.status = "pending";
        }
      });
    } else if (currentStatus === "Rejected" && currentStepLevel) {
      approvalSteps.forEach(step => {
        if (step.level && step.level < currentStepLevel) {
          step.status = "completed";
          step.date = formatDateTimeID(toJakartaIsoFromLocal());
        } else if (step.level && step.level === currentStepLevel) {
          step.status = "rejected";
        }
      });
    }

    // No verification steps in fallback
    return { approvalSteps, verificationSteps: [] };
  };

  // Calculate progress percentage based on completed steps
  const calculateProgressPercentage = (steps) => {
    if (!steps || steps.length === 0) return 0;

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;

    if (totalSteps === 0) return 0;

    // Divide the progress equally across all visible steps.
    // Each completed step contributes 1/totalSteps of the progress.
    const pct = Math.round((completedSteps / totalSteps) * 100);

    // Clamp between 0 and 100 for safety
    return Math.min(100, Math.max(0, pct));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  // Render approval steps on top row and verification steps on a separate row (if any)
  const approvalSteps = workflows.approvalSteps || [];
  const verificationSteps = workflows.verificationSteps || [];

  // Split verification steps into Verifikasi Lapangan (regular verification) and Mengetahui nodes
  const verifikasiLapanganSteps = verificationSteps.filter(s => !s.isMengetahui);
  const mengetahuiSteps = verificationSteps.filter(s => s.isMengetahui);

  // Handle parallel APJ steps for workflows with multiple APJ departments
  const processStepsForDisplay = (steps) => {
    // Check if we need parallel APJ processing:
    // 1. Recall & Prekursor: needs APJ PN and APJ QA
    // 2. Recall (Produk Pangan): needs APJ QA and PJKPO
    const needsParallelAPJ = golonganLimbahName && (
      (golonganLimbahName.toLowerCase().includes('recall') && golonganLimbahName.toLowerCase().includes('prekursor')) ||
      (golonganLimbahName.toLowerCase().includes('recall') && isProdukPangan)
    );
    
    if (!needsParallelAPJ) {
      return steps;
    }

    // Find APJ steps (including PJKPO) at level 2 and group them as parallel
    const processedSteps = [];
    const apjSteps = [];
    
    steps.forEach(step => {
      if (step.level === 2 && (step.role?.includes('APJ') || step.step?.includes('APJ') || step.role === 'PJKPO')) {
        apjSteps.push(step);
      } else {
        // If we have collected APJ steps and now hit a non-APJ step, add them as parallel
        if (apjSteps.length > 0) {
          processedSteps.push({ type: 'parallel', steps: [...apjSteps] });
          apjSteps.length = 0; // Clear array
        }
        processedSteps.push(step);
      }
    });

    // Handle remaining APJ steps at the end
    if (apjSteps.length > 0) {
      processedSteps.push({ type: 'parallel', steps: apjSteps });
    }

    return processedSteps;
  };

  const renderParallelSteps = (parallelSteps, index) => (
    // Render each APJ step as separate nodes side by side
    parallelSteps.map((step, pIndex) => (
      <div key={`parallel-${index}-${pIndex}`} className="flex flex-col items-center flex-1 relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
          step.status === 'completed' 
            ? 'bg-green-600 text-white' 
            : step.status === 'rejected'
            ? 'bg-red-600 text-white'
            : step.status === 'pending' 
            ? 'bg-gray-200 text-gray-400' 
            : 'bg-gray-100 text-gray-300'
        }`}>
          {step.status === 'completed' ? (
            <CheckIcon />
          ) : step.status === 'rejected' ? (
            <div className="w-4 h-4 text-white flex items-center justify-center">
              <div className="w-3 h-0.5 bg-current"></div>
            </div>
          ) : (
            <ClockIcon />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">{step.step}</p>
          <p className="text-xs text-gray-500">{step.role}</p>
          <p className="text-xs font-medium text-gray-700">
            {Number(step.apprNo) === 3 ? (
              step.person
            ) : (delegated && (step.status === 'completed' || step.status === 'rejected') ? (() => {
              const personStr = String(step.person || '').trim();
              const delegatedName = (delegated && (delegated.Nama || delegated.log_NIK)) ? (delegated.Nama || delegated.log_NIK) : '';
              if (!delegatedName) return personStr || null;

              const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
              const personNorm = normalize(personStr);
              const delegatedNorm = normalize(delegatedName);

              if (personNorm && delegatedNorm && personNorm === delegatedNorm) {
                return <span className="text-xs text-gray-700">{personStr || delegatedName}</span>;
              }

              const alreadyHasAn = /a\.n\./i.test(personStr);
              const alreadyHasDelegated = personNorm && delegatedNorm && personNorm.includes(delegatedNorm);

              if (alreadyHasDelegated && alreadyHasAn) return personStr || null;

              const content = `${delegatedName} a.n. ${personStr}`.trim();
              return <span className="text-xs text-gray-700">{content}</span>;
            })() : (
              step.person
            ))}
          </p>
          {step.date && (
            <p className="text-xs text-gray-500 mt-1">{step.date}</p>
          )}
        </div>
      </div>
    ))
  );

  const renderRow = (stepsArray) => {
    const processedSteps = processStepsForDisplay(stepsArray);
    
    return (
      <div className="relative mb-6">
        <div className="flex items-center justify-between">
          {processedSteps.flatMap((item, index) => (
            item.type === 'parallel' ? 
              renderParallelSteps(item.steps, index) 
            : (
              <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  item.status === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : item.status === 'rejected'
                    ? 'bg-red-600 text-white'
                    : item.status === 'pending' 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-gray-100 text-gray-300'
                }`}>
                  {item.status === 'completed' ? (
                    <CheckIcon />
                  ) : item.status === 'rejected' ? (
                    <div className="w-4 h-4 text-white flex items-center justify-center">
                      <div className="w-3 h-0.5 bg-current"></div>
                    </div>
                  ) : (
                    <ClockIcon />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{item.step}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                  <p className="text-xs font-medium text-gray-700">
                    {/* For Verifikasi Lapangan (apprNo/level === 3) the verifier signs as themselves
                        (they authenticate inside the modal). Do not render delegated 'a.n.' prefix
                        for these steps; show the person string directly. For other steps, preserve
                        existing delegated display behavior. */}
                    {Number(item.apprNo) === 3 ? (
                      // Always prefer the person string as-is for verification nodes
                      item.person
                    ) : (delegated && (item.status === 'completed' || item.status === 'rejected') ? (() => {
                      // When action was performed on behalf of someone, show: `${delegatedName} a.n. ${personStr}`
                      // But if the person is the same as delegatedName, show only the name (no `a.n.`)
                      const personStr = String(item.person || '').trim();
                      const delegatedName = (delegated && (delegated.Nama || delegated.log_NIK)) ? (delegated.Nama || delegated.log_NIK) : '';
                      if (!delegatedName) return personStr || null;

                      const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
                      const personNorm = normalize(personStr);
                      const delegatedNorm = normalize(delegatedName);

                      // If person equals delegated target, just show the single name
                      if (personNorm && delegatedNorm && personNorm === delegatedNorm) {
                        return <span className="text-xs text-gray-700">{personStr || delegatedName}</span>;
                      }

                      const alreadyHasAn = /a\.n\./i.test(personStr);
                      const alreadyHasDelegated = personNorm && delegatedNorm && personNorm.includes(delegatedNorm);

                      // If the person string already contains both delegated name and 'a.n.', prefer the original personStr
                      if (alreadyHasDelegated && alreadyHasAn) return personStr || null;

                      const content = `${delegatedName} a.n. ${personStr}`.trim();
                      return <span className="text-xs text-gray-700">{content}</span>;
                    })() : (
                      item.person
                    ))}
                  </p>
                  {item.date && (
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div 
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${calculateProgressPercentage(stepsArray)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderRow(approvalSteps)}
      {verifikasiLapanganSteps && verifikasiLapanganSteps.length > 0 && (
        <div>
          {/* Verifikasi Lapangan row */}
          {renderRow(verifikasiLapanganSteps)}
        </div>
      )}

      {mengetahuiSteps && mengetahuiSteps.length > 0 && (
        <div className="mt-4">
          {/* Mengetahui (HSE/KL) row - stands alone below verification */}
          {renderRow(mengetahuiSteps)}
        </div>
      )}
    </div>
  );
};

export default WorkflowSteps;