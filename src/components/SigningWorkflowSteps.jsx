import { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeID } from '../utils/time';

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

const SigningWorkflowSteps = ({ 
  requestId, 
  currentStatus, 
  requesterName, 
  submittedAt, 
  golonganLimbahId, 
  golonganLimbahName, 
  currentStepLevel, 
  bagian = '', 
  signingWorkflow = [], // Accept pre-fetched workflow data from parent
  isProdukPangan = false // Add isProdukPangan parameter
}) => {
  const { user } = useAuth();
  const delegated = user && user.delegatedTo ? user.delegatedTo : null;
  
  const [workflows, setWorkflows] = useState({ signingSteps: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to filter signers based on department and business logic
  const filterSignersByDepartment = (signers, stepName) => {
    if (!signers || signers.length === 0) {
      return signers;
    }

    // For Department Manager steps, we need to apply specific filtering logic
    if (isDepartmentManagerStep({ step_name: stepName })) {
      if (!bagian) {
        console.warn('Department (bagian) not provided for Department Manager step');
        return signers;
      }

      const target = String(bagian).trim().toLowerCase();

      // Normalize department fields using the correct API attribute names
      const normalizeDept = (s) => {
        const candidates = [
          s.signer_dept_id,     // Primary field from API
          s.signer_dept_name,   // Fallback if available
          s.emp_DeptID,         // Legacy support
          s.Appr_DeptID,        // Legacy support
        ];
        const found = candidates.find(c => c != null && c !== '');
        return (found || '').toString().trim().toLowerCase();
      };

      // Exact match first
      let filteredSigners = signers.filter(signer => {
        const dept = normalizeDept(signer);
        return dept && dept === target;
      });

      // If no exact matches, try substring matches (handle values like 'NTADM1')
      if (filteredSigners.length === 0) {
        filteredSigners = signers.filter(signer => {
          const dept = normalizeDept(signer);
          return dept && (dept.includes(target) || target.includes(dept));
        });
      }

      // If still no signers found for the department, return the original list
      if (filteredSigners.length === 0) {
        console.warn(`No signers found for department ${bagian}, showing all signers`);
        return signers;
      }

      return filteredSigners;
    }

    // For non-Department Manager steps (HSE, APJ, Head of Plant), return all signers
    // as they are already pre-filtered by the backend based on business logic
    return signers;
  };

  // Helper to detect Department Manager signature step by name (case-insensitive)
  const isDepartmentManagerStep = (step) => {
    if (!step || !step.step_name) return false;
    const stepName = step.step_name.toLowerCase();
    
    // Exclude APJ, HSE, and Head of Plant steps explicitly
    if (stepName.includes('apj') || 
        stepName.includes('hse') || 
        stepName.includes('head of plant') || 
        stepName.includes('plant manager')) {
      return false;
    }
    
    // Only match pure department manager steps
    return /^department manager$|^manager departemen$|^tanda tangan manajer$/i.test(step.step_name.trim());
  };

  // Helper function to get appropriate placeholder text based on step name
  const getSignerPlaceholder = (stepName) => {
    if (!stepName) return "Akan ditentukan";
    
    const name = stepName.toLowerCase();
    if (name.includes('hse')) return "HSE Manager";
    if (name.includes('department') || name.includes('departemen')) return "Department Manager";
    if (name.includes('apj')) return "APJ";
    if (name.includes('head of plant') || name.includes('plant')) return "Head of Plant";
    if (name.includes('manager')) return "Manager";
    if (name.includes('officer')) return "Officer";
    
    return "Akan ditentukan";
  };

  // Use centralized Jakarta formatter so displayed wall-clock matches stored +07:00 values
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return formatDateTimeID(timestamp);
  };

  // Individual signature tracking: Each step shows timestamp immediately when any user at that level approves,
  // without waiting for all users at the same level to complete (similar to WorkflowSteps component behavior)

  // Helper function to determine which APJ roles are required based on golongan limbah and isProdukPangan
  const getRequiredApjRoles = () => {
    if (!golonganLimbahName) return [];

    const categoryName = golonganLimbahName.toLowerCase();
    const hasPrecursor = categoryName.includes('prekursor') || categoryName.includes('oot');
    const hasRecall = categoryName.includes('recall');
    const hasRecallPrecursor = categoryName.includes('recall') && categoryName.includes('prekursor');

    const requiredRoles = [];

    if (hasRecallPrecursor) {
      // For "Recall & Prekursor", require both APJ PN and APJ QA
      requiredRoles.push('PN', 'QA');
    } else if (hasPrecursor) {
      // For pure Prekursor/OOT, require APJ PN only
      requiredRoles.push('PN');
    } else if (hasRecall) {
      // For pure Recall, require APJ QA
      requiredRoles.push('QA');
      // For Recall with produk pangan, also require PJKPO (HC)
      if (isProdukPangan) {
        requiredRoles.push('HC');
      }
    }

    return requiredRoles;
  };

  useEffect(() => {
    // Build the displayed signing workflow from either provided signingWorkflow or fetched per-request workflow
    const buildWorkflowFromData = (inputWorkflow) => {
      try {
        setLoading(true);

        const signingSteps = [];

        // Add submission step (always first and completed)
        signingSteps.push({
          step: 'Diserahkan',
          role: 'Pemohon',
          person: requesterName || 'Unknown',
          date: formatTimestamp(submittedAt),
          status: 'completed',
          level: 0
        });

        // Prefer inputWorkflow (from fetch) if provided, otherwise use signingWorkflow prop
        const wf = Array.isArray(inputWorkflow) && inputWorkflow.length > 0 ? inputWorkflow : (Array.isArray(signingWorkflow) ? signingWorkflow : []);

        if (wf && wf.length > 0) {
          // Sort steps by step_level and skip step_level === 1 because 'Diserahkan'
          // is represented by the submission step above and should not be
          // repeated in the displayed signing steps.
          const sortedSteps = [...wf]
            .filter(s => Number(s.step_level || 0) !== 1)
            .sort((a, b) => Number(a.step_level || 0) - Number(b.step_level || 0));

          sortedSteps.forEach(step => {
            const stepLevel = Number(step.step_level || 0);
            
            // Special handling for APJ steps (step_level 3)
            if (stepLevel === 3 && (step.step_name === 'APJ Signature' || step.step_name.includes('APJ'))) {
              // Get only the required APJ roles based on golongan limbah and isProdukPangan
              const requiredApjRoles = getRequiredApjRoles();
              
              if (requiredApjRoles.length > 0) {
                // Define all possible APJ roles
                const allApjRoles = [
                  { key: 'PN', title: 'APJ PN', deptFilter: 'PN1' },
                  { key: 'QA', title: 'APJ QA', deptFilter: 'QA' },
                  { key: 'HC', title: 'PJKPO', deptFilter: 'HC' }
                ];

                // Filter to only include required roles
                const neededApjRoles = allApjRoles.filter(role => requiredApjRoles.includes(role.key));

                neededApjRoles.forEach(apjRole => {
                  // Filter signers for this specific APJ role
                  const roleSigners = (step.signers || []).filter(s => {
                    const dept = (s.signer_dept_id || s.emp_DeptID || '').toString().toUpperCase();
                    return dept === apjRole.deptFilter;
                  });

                  // Find if any signer from this role has actually signed (similar to WorkflowSteps approach)
                  const completedSigner = roleSigners.find(s => 
                    s.signed_at && (s.signer_name || s.log_nik)
                  );

                  let status = 'pending';
                  let signerName = "Akan ditentukan";
                  let signerDate = null;

                  if (completedSigner) {
                    // Someone from this role has signed - show immediately like WorkflowSteps
                    signerName = completedSigner.signer_name || completedSigner.log_nik;
                    signerDate = completedSigner.signed_at;
                    status = 'completed';
                  } else {
                    // No one from this role has signed yet
                    // Show assigned signer if available
                    const namedSigner = roleSigners.find(s => s.signer_name || s.log_nik);
                    if (namedSigner) {
                      signerName = namedSigner.signer_name || namedSigner.log_nik;
                    } else {
                      signerName = apjRole.title;  // Fallback to role name
                    }

                    // Only mark as completed if general workflow status indicates so
                    if (currentStatus === 'Completed' || currentStatus === 'Approved') {
                      status = 'completed';
                      // If no individual signature but workflow is complete, use submitted date as fallback
                      if (!signerDate && submittedAt) {
                        signerDate = submittedAt;
                      }
                    } else if (currentStatus === 'InProgress') {
                      if (currentStepLevel && stepLevel < currentStepLevel) {
                        status = 'completed';
                        if (!signerDate && submittedAt) {
                          signerDate = submittedAt;
                        }
                      } else if (currentStepLevel && stepLevel === currentStepLevel) {
                        status = 'pending';
                      }
                    }
                  }

                  const apjStepObj = {
                    step: 'Menandatangani',
                    role: apjRole.title,
                    person: signerName,
                    date: signerDate ? formatTimestamp(signerDate) : null,
                    status,
                    level: stepLevel,
                    signers: roleSigners,
                    apjRole: apjRole.key
                  };

                  signingSteps.push(apjStepObj);
                });
              } else {
                // No APJ roles required - this must be Department Manager signature for Standard workflow
                let status = 'pending';
                let signerName = "Akan ditentukan";
                let signerDate = null;

                // Check if step has actual signature data
                if (step.signed_at && step.signer_name) {
                  signerDate = step.signed_at;
                  signerName = step.signer_name;
                  status = 'completed';
                } else if (step.signers && Array.isArray(step.signers) && step.signers.length > 0) {
                  const filteredSigners = filterSignersByDepartment(step.signers, step.step_name);
                  
                  const completedSigner = filteredSigners.find(s => 
                    s.signed_at && (s.signer_name || s.log_nik)
                  );

                  if (completedSigner) {
                    signerName = completedSigner.signer_name || completedSigner.log_nik;
                    signerDate = completedSigner.signed_at;
                    status = 'completed';
                  } else {
                    // Check general status logic
                    if (currentStatus === 'Completed' || currentStatus === 'Approved') {
                      status = 'completed';
                    } else if (currentStatus === 'InProgress') {
                      if (currentStepLevel && stepLevel < currentStepLevel) {
                        status = 'completed';
                      } else if (currentStepLevel && stepLevel === currentStepLevel) {
                        status = 'pending';
                      }
                    }

                    const namedSigner = filteredSigners.find(s => s.signer_name || s.log_nik);
                    if (namedSigner) {
                      signerName = namedSigner.signer_name || namedSigner.log_nik;
                    } else {
                      signerName = 'Department Manager';
                    }
                  }
                } else {
                  signerName = 'Department Manager';
                }

                const deptManagerStepObj = {
                  step: 'Menandatangani',
                  role: 'Department Manager',
                  person: signerName,
                  date: signerDate ? formatTimestamp(signerDate) : null,
                  status,
                  level: stepLevel,
                  signers: step.signers || []
                };

                signingSteps.push(deptManagerStepObj);
              }
            } else {
              // Non-APJ steps - handle normally with individual signature tracking
              let status = 'pending';
              let signerName = "Akan ditentukan";
              let signerDate = null;

              // First check if the step itself has actual signature data
              if (step.signed_at && step.signer_name) {
                signerDate = step.signed_at;
                signerName = step.signer_name;
                status = 'completed';
              } else if (step.signers && Array.isArray(step.signers) && step.signers.length > 0) {
                const filteredSigners = filterSignersByDepartment(step.signers, step.step_name);

                // Find a completed signer first (someone who has actually signed) - like WorkflowSteps
                const completedSigner = filteredSigners.find(s => 
                  s.signed_at && (s.signer_name || s.log_nik)
                );

                if (completedSigner) {
                  // Use actual signer name and timestamp from the completed signature
                  signerName = completedSigner.signer_name || completedSigner.log_nik;
                  signerDate = completedSigner.signed_at;
                  status = 'completed';
                } else {
                  // No one has signed yet - determine status based on workflow state
                  if (step.status === 'signed' || step.signed_at) {
                    status = 'completed';
                  } else if (currentStatus === 'Completed' || currentStatus === 'Approved') {
                    status = 'completed';
                  } else if (currentStatus === 'Draft') {
                    status = 'pending';
                  } else if (currentStatus === 'InProgress') {
                    if (currentStepLevel && stepLevel < currentStepLevel) {
                      status = 'completed';
                    } else if (currentStepLevel && stepLevel === currentStepLevel) {
                      status = 'pending';
                    } else {
                      status = 'pending';
                    }
                  } else if (currentStatus === 'Rejected') {
                    if (currentStepLevel && stepLevel < currentStepLevel) {
                      status = 'completed';
                    } else if (currentStepLevel && stepLevel === currentStepLevel) {
                      status = 'rejected';
                    } else {
                      status = 'pending';
                    }
                  }

                  // Show assigned signers using correct API attributes
                  const namedSigner = filteredSigners.find(s => 
                    s.signer_name || s.log_nik
                  );
                  
                  if (namedSigner) {
                    // Prefer signer_name over log_nik for display
                    signerName = namedSigner.signer_name || namedSigner.log_nik;
                  } else {
                    // No assigned signers with names, use placeholder
                    signerName = getSignerPlaceholder(step.step_name);
                  }

                  // Handle multiple signers display (but don't wait for all to complete)
                  if (filteredSigners.length > 1) {
                    const namedSigners = filteredSigners.filter(s => 
                      s.signer_name || s.log_nik
                    );
                    if (namedSigners.length > 1) {
                      const firstName = namedSigners[0].signer_name || namedSigners[0].log_nik;
                      signerName = `${firstName} (+${namedSigners.length - 1} lainnya)`;
                    } else if (namedSigners.length === 0) {
                      // No named signers, show count
                      signerName = `${getSignerPlaceholder(step.step_name)} (${filteredSigners.length} orang)`;
                    }
                  }

                  // If general workflow indicates completion but no individual signature, use fallback date
                  if (status === 'completed' && !signerDate && submittedAt) {
                    signerDate = submittedAt;
                  }
                }
              } else {
                // No signers array - use step-level status
                if (step.status === 'signed' || step.signed_at) {
                  status = 'completed';
                  signerDate = step.signed_at;
                  signerName = step.signer_name || getSignerPlaceholder(step.step_name);
                } else {
                  // Determine status based on workflow state
                  if (currentStatus === 'Completed' || currentStatus === 'Approved') {
                    status = 'completed';
                    if (submittedAt) signerDate = submittedAt;
                  } else if (currentStatus === 'InProgress') {
                    if (currentStepLevel && stepLevel < currentStepLevel) {
                      status = 'completed';
                      if (submittedAt) signerDate = submittedAt;
                    } else if (currentStepLevel && stepLevel === currentStepLevel) {
                      status = 'pending';
                    }
                  } else if (currentStatus === 'Rejected') {
                    if (currentStepLevel && stepLevel < currentStepLevel) {
                      status = 'completed';
                      if (submittedAt) signerDate = submittedAt;
                    } else if (currentStepLevel && stepLevel === currentStepLevel) {
                      status = 'rejected';
                    }
                  }
                  signerName = getSignerPlaceholder(step.step_name);
                }
              }

              const stepObj = {
                // Use the action_type from API if available, otherwise default to 'Menandatangani'
                step: step.action_type || 'Menandatangani',
                role: step.step_name || 'Penandatangan',
                person: signerName,
                date: signerDate ? formatTimestamp(signerDate) : null,
                status,
                level: stepLevel,
                signers: step.signers || []
              };

              signingSteps.push(stepObj);
            }
          });
        } else {
          // Build fallback workflow
          const fallbackSteps = buildFallbackSteps();
          signingSteps.push(...fallbackSteps);
        }

        // Sort by level
        signingSteps.sort((a, b) => Number(a.level || 0) - Number(b.level || 0));

        setWorkflows({ signingSteps });
        setError(null);
      } catch (err) {
        console.error('Error building workflow:', err);
        setError('Failed to build signing workflow');
        setWorkflows({ signingSteps: [] });
      } finally {
        setLoading(false);
      }
    };

    const loadAndBuild = async () => {
      setLoading(true);
      try {
        let inputWorkflow = signingWorkflow && signingWorkflow.length > 0 ? signingWorkflow : null;

        // If parent did not provide signingWorkflow, try to fetch per-request workflow
        if ((!inputWorkflow || inputWorkflow.length === 0) && requestId) {
          try {
            const resp = await dataAPI.getSigningWorkflowByRequest(requestId);
            if (resp && resp.data) {
              // Handle the API response structure based on your example
              const d = resp.data.data ?? resp.data;
              if (Array.isArray(d)) {
                inputWorkflow = d;
              } else if (d && d.SigningWorkflowSteps) {
                inputWorkflow = d.SigningWorkflowSteps;
              } else {
                inputWorkflow = [];
              }
            }
          } catch (err) {
            console.warn('Failed to fetch signing workflow for request:', err);
            inputWorkflow = signingWorkflow || [];
          }
        }

        buildWorkflowFromData(inputWorkflow);
      } finally {
        setLoading(false);
      }
    };

    loadAndBuild();
  }, [requestId, currentStatus, requesterName, submittedAt, currentStepLevel, bagian, signingWorkflow]);

  // Build fallback workflow steps when no data is available
  const buildFallbackSteps = () => {
    const steps = [
      {
        step: "Menandatangani",
        role: "HSE Manager",
        person: "Akan ditentukan",
        date: null,
        status: "pending", 
        level: 2
      },
      {
        step: "Menandatangani",
        role: "Department Manager",
        person: "Akan ditentukan",
        date: null,
        status: "pending",
        level: 3
      },
      {
        step: "Menandatangani",
        role: "Head of Plant", 
        person: "Akan ditentukan",
        date: null,
        status: "pending",
        level: 4
      }
    ];

    // Update status based on currentStepLevel
    if (currentStatus === "InProgress" && currentStepLevel) {
      steps.forEach(step => {
        if (step.level < currentStepLevel) {
          step.status = "completed";
          step.date = formatTimestamp(submittedAt);
        } else if (step.level === currentStepLevel) {
          step.status = "pending";
        }
      });
    } else if (currentStatus === "Completed" || currentStatus === "Approved") {
      steps.forEach(step => {
        step.status = "completed";
        step.date = formatTimestamp(submittedAt);
      });
    } else if (currentStatus === "Rejected" && currentStepLevel) {
      steps.forEach(step => {
        if (step.level < currentStepLevel) {
          step.status = "completed";
          step.date = formatTimestamp(submittedAt);
        } else if (step.level === currentStepLevel) {
          step.status = "rejected";
        }
      });
    }

    return steps;
  };

  // Calculate progress percentage based on completed steps
  const calculateProgressPercentage = (steps) => {
    if (!steps || steps.length === 0) return 0;

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;

    if (totalSteps === 0) return 0;

    const pct = Math.round((completedSteps / totalSteps) * 100);
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

  const signingSteps = workflows.signingSteps || [];

  if (signingSteps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No signing workflow steps available</p>
      </div>
    );
  }

  // Handle parallel signing steps at the same level
  const processStepsForDisplay = (steps) => {
    // Group steps by level, creating parallel displays for multiple signers at same level
    const processedSteps = [];
    const stepsByLevel = {};
    
    // Group steps by level
    steps.forEach(step => {
      const level = step.level;
      if (!stepsByLevel[level]) {
        stepsByLevel[level] = [];
      }
      stepsByLevel[level].push(step);
    });
    
    // Process each level, creating parallel groups where needed
    const sortedLevels = Object.keys(stepsByLevel).sort((a, b) => Number(a) - Number(b));
    
    sortedLevels.forEach(level => {
      const stepsAtLevel = stepsByLevel[level];
      
      if (stepsAtLevel.length === 1) {
        // Single step at this level - add directly
        processedSteps.push(stepsAtLevel[0]);
      } else {
        // Multiple steps at same level - group as parallel
        processedSteps.push({ 
          type: 'parallel', 
          steps: stepsAtLevel 
        });
      }
    });

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
            {delegated && step.status === 'completed' ? (() => {
                const personStr = String(step.person || '').trim();
                const delegatedName = (delegated && (delegated.Nama || delegated.log_NIK)) ? (delegated.Nama || delegated.log_NIK) : '';
                if (!delegatedName) return personStr || null;

                const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
                const personNorm = normalize(personStr);
                const delegatedNorm = normalize(delegatedName);

                // If the signer is the same as delegated target, show only the single name
                if (personNorm && delegatedNorm && personNorm === delegatedNorm) {
                  return <span className="text-xs text-gray-700">{personStr || delegatedName}</span>;
                }

                const alreadyHasAn = /a\.n\./i.test(personStr);
                const alreadyHasDelegated = personNorm && delegatedNorm && personNorm.includes(delegatedNorm);

                if (alreadyHasDelegated && alreadyHasAn) return personStr || null;

                const content = `${delegatedName} a.n. ${personStr}`.trim();
                return <span className="text-xs text-gray-700">{content}</span>;
              })() : (
                <>
                  {step.person}
                </>
              )}
          </p>
          {step.date && (
            <p className="text-xs text-gray-500 mt-1">{step.date}</p>
          )}
        </div>
      </div>
    ))
  );

  const processedSteps = processStepsForDisplay(signingSteps);

  return (
    <div>
      <div className="relative">
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
                    {delegated && item.status === 'completed' ? (() => {
                        const personStr = String(item.person || '').trim();
                        const delegatedName = (delegated && (delegated.Nama || delegated.log_NIK)) ? (delegated.Nama || delegated.log_NIK) : '';
                        if (!delegatedName) return personStr || null;

                        const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
                        const personNorm = normalize(personStr);
                        const delegatedNorm = normalize(delegatedName);

                        // If the signer is the same as delegated target, show only the single name
                        if (personNorm && delegatedNorm && personNorm === delegatedNorm) {
                          return <span className="text-xs text-gray-700">{personStr || delegatedName}</span>;
                        }

                        const alreadyHasAn = /a\.n\./i.test(personStr);
                        const alreadyHasDelegated = personNorm && delegatedNorm && personNorm.includes(delegatedNorm);

                        if (alreadyHasDelegated && alreadyHasAn) return personStr || null;

                        const content = `${delegatedName} a.n. ${personStr}`.trim();
                        return <span className="text-xs text-gray-700">{content}</span>;
                      })() : (
                        <>
                          {item.person}
                        </>
                      )}
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
            style={{ width: `${calculateProgressPercentage(signingSteps)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SigningWorkflowSteps;