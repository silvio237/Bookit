"use client"

import React, { useEffect, useState, useCallback } from 'react';
import Wrapper from '@/app/components/Wrapper';
import Notification from '@/app/components/Notification';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface Employee {
  id: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
}

const Page = ({ params }: { params: { companyId: string } }) => {
  const { user } = useKindeBrowserClient();

  const [employeeEmail, setEmployeeEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [notification, setNotification] = useState<string>('');

  const closeNotification = () => setNotification('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees?companyId=${params.companyId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      const data = await response.json();
      setEmployees(data.employees);
      setCompanyName(data.companyName);
    } catch (error) {
      console.error(error);
      setNotification('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  }, [params.companyId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.companyId,
          creatorEmail: user?.email,
          employeeEmail,
          action: 'ADD',
        }),
      });

      const data = await response.json();
      setNotification(response.ok ? 'Employé ajouté avec succès !' : data.message);
      if (response.ok) fetchEmployees();
      setEmployeeEmail('');
    } catch (error) {
      console.error(error);
      setNotification('Erreur interne du serveur');
    }
  };

  const handleRemoveEmployee = async (email: string) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.companyId,
          creatorEmail: user?.email,
          employeeEmail: email,
          action: 'DELETE',
        }),
      });

      const data = await response.json();
      setNotification(response.ok ? 'Employé supprimé avec succès !' : data.message);
      if (response.ok) fetchEmployees();
    } catch (error) {
      console.error(error);
      setNotification('Erreur interne du serveur');
    }
  };

  return (
    <Wrapper>
      {notification && (
        <Notification message={notification} onclose={closeNotification} />
      )}

      <div>
        {loading ? (
          <div className='text-center mt-32'>
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <>
            <div className="badge badge-secondary badge-outline mb-2">
              {companyName}
            </div>

            <h1 className='text-2xl mb-4'>Ajouter un Nouvel Employé</h1>
            <form onSubmit={handleAddEmployee} className='mb-6 flex'>
              <input
                type="email"
                placeholder="Email de l&apos;employé"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                className='input input-bordered max-w-xs w-full'
                required
              />
              <button type='submit' className='btn btn-secondary ml-2'>
                Ajouter l&apos;employé
              </button>
            </form>

            <h1 className='text-2xl mb-4'>Liste des Employés</h1>
            {employees.length > 0 ? (
              <ol className='divide-y divide-base-200'>
                {employees.map((employee) => {
                  const hasFullname = employee.givenName && employee.familyName;
                  return (
                    <li key={employee.id} className='py-4 flex flex-col md:flex-row justify-between items-start md:items-center'>
                      <div className='flex items-center'>
                        <span className={`relative flex h-3 w-3 mr-2 rounded-full ${hasFullname ? 'bg-green-500' : 'bg-red-500'}`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasFullname ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="relative inline-flex rounded-full h-3 w-3" />
                        </span>

                        <div>
                          <span className='font-bold'>{employee.email}</span>
                          <div className='italic mt-1 text-gray-400'>
                            {hasFullname
                              ? `${employee.givenName} ${employee.familyName}`
                              : 'Pas encore inscrit'}
                          </div>
                        </div>
                      </div>

                      <button
                        className='btn btn-outline btn-secondary btn-sm mt-2 md:mt-0'
                        onClick={() => handleRemoveEmployee(employee.email)}
                      >
                        Enlever
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p>Aucun employé trouvé.</p>
            )}
          </>
        )}
      </div>
    </Wrapper>
  );
};

export default Page;
