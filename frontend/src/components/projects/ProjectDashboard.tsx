import React from 'react';
import { Project, Task, ProjectStatistics } from '../../services/projectService';
import { FolderOpen, CheckSquare, Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

interface ProjectDashboardProps {
  stats: ProjectStatistics;
  projects: Project[];
  tasks: Task[];
  onRefresh: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  stats,
  projects,
  tasks,
  onRefresh
}) => {
  // Get recent projects (last 5)
  const recentProjects = projects.slice(0, 5);

  // Get overdue tasks
  const overdueTasks = Array.isArray(tasks) ? tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  ).slice(0, 5) : [];

  // Get projects by status
  const projectsByStatus = Array.isArray(projects) ? projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  // Get tasks by status
  const tasksByStatus = Array.isArray(tasks) ? tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'on_hold': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'todo': 'bg-gray-100 text-gray-800',
      'review': 'bg-purple-100 text-purple-800',
      'done': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getProjectProgress = (project: Project) => {
    return project.progress || 0;
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Project Status Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(projectsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Task Status Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects and Overdue Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Projects
              </h3>
              <button
                onClick={onRefresh}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {Array.isArray(recentProjects) && recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{project.description || 'No description'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {getProjectProgress(project)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getProjectProgress(project)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent projects</p>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                Overdue Tasks
              </h3>
              <button
                onClick={onRefresh}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {overdueTasks.length > 0 ? (
                overdueTasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-red-600">
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No overdue tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Progress Overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Project Progress Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(projects) ? projects.filter(p => p.status === 'in_progress').slice(0, 6).map((project) => (
              <div key={project.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{project.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-medium text-gray-900">{getProjectProgress(project)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getProjectProgress(project) >= 80 ? 'bg-green-600' :
                      getProjectProgress(project) >= 60 ? 'bg-blue-600' :
                      getProjectProgress(project) >= 40 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${getProjectProgress(project)}%` }}
                  ></div>
                </div>
                {project.endDate && (
                  <div className="flex items-center mt-2">
                    <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      Due: {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )) : null}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-3 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <FolderOpen className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">New Project</span>
            </button>
            <button className="flex items-center p-3 border border-gray-300 rounded-md hover:border-green-500 hover:bg-green-50 transition-colors">
              <CheckSquare className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Add Task</span>
            </button>
            <button className="flex items-center p-3 border border-gray-300 rounded-md hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <Users className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Team Overview</span>
            </button>
            <button className="flex items-center p-3 border border-gray-300 rounded-md hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Project Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
