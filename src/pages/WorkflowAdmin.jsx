import { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

const WorkflowAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [workflows, setWorkflows] = useState({ approvalWorkflows: [], signingWorkflows: [] });
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [selectedWorkflowType, setSelectedWorkflowType] = useState('approval');
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepUsers, setStepUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedJobLevel, setSelectedJobLevel] = useState('');
  const [verifierRole, setVerifierRole] = useState('');
  const [editingStepId, setEditingStepId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load workflows, users, departments, and job levels in parallel
      const [workflowResponse, userResponse, deptResponse, jobLevelResponse] = await Promise.all([
        api.getAllWorkflowsAdmin(),
        api.getUsers(),
        api.getDepartments(),
        api.getJobLevels()
      ]);

      if (workflowResponse.data.success) {
        setWorkflows(workflowResponse.data.data);
      }

      if (userResponse.data.success) {
        setUsers(userResponse.data.data);
      }

      if (deptResponse.data.success) {
        setDepartments(deptResponse.data.data);
      }

      if (jobLevelResponse.data.success) {
        setJobLevels(jobLevelResponse.data.data);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadStepUsers = async (stepId, workflowType) => {
    try {
      let response;
      if (workflowType === 'approval') {
        response = await api.getApproversForStep(stepId);
      } else {
        response = await api.getSignersForStep(stepId);
      }

      if (response.data.success) {
        setStepUsers(response.data.data);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load step users: ' + error.message });
    }
  };

  const handleStepClick = (step, workflowType) => {
    setSelectedStep(step);
    setEditingStepId(step.step_id);
    loadStepUsers(step.step_id, workflowType);
    // If this is a verification step (level === 3) prefill verifier role selector
    if (step.step_level === 3) {
      setVerifierRole('Field Verifier');
    } else {
      setVerifierRole('');
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = userSearchTerm === '' || 
        user.emp_Name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.emp_NIK.toLowerCase().includes(userSearchTerm.toLowerCase());
      
      const matchesDept = selectedDepartment === '' || user.emp_DeptID === selectedDepartment;
      const matchesJobLevel = selectedJobLevel === '' || user.emp_JobLevelID === selectedJobLevel;

      return matchesSearch && matchesDept && matchesJobLevel;
    });
  };

  const addUserToStep = async (user) => {
    if (!selectedStep) return;

    try {
      const userData = {
        approver_id: user.emp_NIK,
        approver_name: user.emp_Name,
        approver_cc: user.emp_CC || '',
        approver_dept_id: user.emp_DeptID,
        approver_identity: user.emp_NIK
      };

       // If assigning to a verification step, include approver_role
       if (selectedStep.step_level === 3 && verifierRole) {
        userData.approver_role = verifierRole;
      }

      if (selectedWorkflowType === 'approval') {
        await api.addApproverToStep(selectedStep.step_id, userData);
      } else {
        const signerData = {
          log_nik: user.emp_NIK,
          peran: user.emp_JobLevel || 'Signer'
        };
        await api.addSignerToStep(selectedStep.step_id, signerData);
      }

      setAlert({ type: 'success', message: 'User added to step successfully' });
      loadStepUsers(selectedStep.step_id, selectedWorkflowType);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to add user: ' + error.message });
    }
  };

  const removeUserFromStep = async (configId) => {
    try {
      if (selectedWorkflowType === 'approval') {
        await api.removeApproverFromStep(configId);
      } else {
        await api.removeSignerFromStep(configId);
      }

      setAlert({ type: 'success', message: 'User removed from step successfully' });
      loadStepUsers(selectedStep.step_id, selectedWorkflowType);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to remove user: ' + error.message });
    }
  };

  const bulkUpdateStepUsers = async () => {
    if (!selectedStep) return;

    try {
      const selectedUsers = getFilteredUsers().filter(user => 
        document.getElementById(`user-${user.emp_NIK}`)?.checked
      );

      if (selectedWorkflowType === 'approval') {
        const approvers = selectedUsers.map(user => ({
          approver_id: user.emp_NIK,
          approver_name: user.emp_Name,
          approver_cc: user.emp_CC || '',
          approver_dept_id: user.emp_DeptID,
          approver_identity: user.emp_NIK
        }));
        // Attach approver_role for verification steps
        if (selectedStep.step_level === 3 && verifierRole) {
          approvers.forEach(a => a.approver_role = verifierRole);
        }
        await api.bulkUpdateApprovers(selectedStep.step_id, approvers);
      } else {
        const signers = selectedUsers.map(user => ({
          log_nik: user.emp_NIK,
          peran: user.emp_JobLevel || 'Signer'
        }));
        await api.bulkUpdateSigners(selectedStep.step_id, signers);
      }

      setAlert({ type: 'success', message: 'Step users updated successfully' });
      loadStepUsers(selectedStep.step_id, selectedWorkflowType);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update step users: ' + error.message });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentWorkflows = selectedWorkflowType === 'approval' 
    ? workflows.approvalWorkflows 
    : workflows.signingWorkflows;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Administration</h1>
        <p className="text-gray-600">Manage users in workflow steps for approval and signing processes</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Selection and Steps */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Type
              </label>
              <select
                value={selectedWorkflowType}
                onChange={(e) => {
                  setSelectedWorkflowType(e.target.value);
                  setSelectedStep(null);
                  setStepUsers([]);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="approval">Approval Workflows</option>
                <option value="signing">Signing Workflows</option>
              </select>
            </div>

            <div className="space-y-4">
              {currentWorkflows.map((workflow) => (
                <div key={workflow.approval_workflow_id || workflow.signing_workflow_id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{workflow.workflow_name}</h3>
                  <div className="space-y-2">
                    {(workflow.ApprovalWorkflowSteps || workflow.SigningWorkflowSteps || []).map((step) => (
                      <button
                        key={step.step_id}
                        onClick={() => handleStepClick(step, selectedWorkflowType)}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          selectedStep?.step_id === step.step_id
                            ? 'bg-green-50 border-green-200 text-green-900'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{step.step_name}</div>
                        <div className="text-sm text-gray-500">Level {step.step_level}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {selectedWorkflowType === 'approval' 
                            ? `${(step.ApprovalWorkflowApprovers || []).length} approvers`
                            : `${(step.SigningWorkflowSigners || []).length} signers`
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="lg:col-span-2">
          {selectedStep ? (
            <div className="space-y-6">
              {/* Current Step Users */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Current Users in {selectedStep.step_name}
                </h3>
                {stepUsers.length > 0 ? (
                  <div className="space-y-2">
                    {stepUsers.map((stepUser) => (
                      <div 
                        key={stepUser.approver_config_id || stepUser.signer_config_id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <div className="font-medium">
                            {stepUser.approver_name || stepUser.log_nik}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stepUser.approver_dept_id || stepUser.peran}
                            {stepUser.approver_role ? ` • ${stepUser.approver_role}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => removeUserFromStep(stepUser.approver_config_id || stepUser.signer_config_id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No users assigned to this step</p>
                )}
              </div>

              {/* User Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assign Users to Step
                  </h3>
                  <button
                    onClick={bulkUpdateStepUsers}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Bulk Update
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Users
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name or NIK..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Level
                    </label>
                    <select
                      value={selectedJobLevel}
                      onChange={(e) => setSelectedJobLevel(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">All Job Levels</option>
                      {jobLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Verifier Role (only for verification steps) */}
                {selectedStep && selectedStep.step_level === 3 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verifier Role</label>
                    <input
                      type="text"
                      value={verifierRole}
                      onChange={(e) => setVerifierRole(e.target.value)}
                      placeholder="e.g. Field Verifier, Inspector"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">This role will be attached to approvers assigned to this verification step.</p>
                  </div>
                )}

                {/* User List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  {getFilteredUsers().length > 0 ? (
                    <div className="space-y-1 p-2">
                      {getFilteredUsers().map((user) => (
                        <div key={user.emp_NIK} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`user-${user.emp_NIK}`}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="font-medium">{user.emp_Name}</div>
                              <div className="text-sm text-gray-500">
                                {user.emp_NIK} • {user.emp_DeptID} • {user.emp_JobLevelID}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => addUserToStep(user)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No users found with current filters
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workflow Step</h3>
                <p className="text-gray-500">Choose a workflow step from the left panel to manage its users</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowAdmin;
