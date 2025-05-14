'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import Wrapper from '../components/Wrapper';
import Image from 'next/image';
import { SquareArrowOutUpRight, Users } from 'lucide-react';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  capacity: number;
  description: string;
  imgUrl?: string;
}

const Page = () => {
  const { user } = useKindeBrowserClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [companyName, setCompanyName] = useState('');

  const cleanupExpiredReservations = useCallback(async () => {
    try {
      await fetch('/api/cleanupReservations', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchCompanyId = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          famillyName: user.family_name,
          givenName: user.given_name,
        }),
      });

      const data = await response.json();
      setCompanyId(data.companyId || null);
    } catch (error) {
      console.error('Erreur fetchCompanyId:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const url = companyId ? `/api/rooms?companyId=${companyId}` : `/api/rooms`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des salles.');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
      setCompanyName(data.companyName || '');
    } catch (error) {
      console.error('Erreur fetchRooms:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    fetchCompanyId();
  }, [fetchCompanyId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    cleanupExpiredReservations();
  }, [cleanupExpiredReservations]);

  if (loading) {
    return (
      <Wrapper>
        <div className="w-full flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div>
        {companyName ? (
          <div className="badge badge-secondary badge-outline">{companyName}</div>
        ) : (
          <div className="text-sm text-gray-500 mb-4 ">
            Vous n’êtes pas encore rattaché à une entreprise. NB: Seul les employés de l'entreprise peuvent reservés des salles.
          </div>
          
        )}

        <h1 className="text-2xl mb-4">Réserver une salle</h1>

        {rooms.length === 0 ? (
          <p>Aucune salle disponible.</p>
        ) : (
          <ul className="grid md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <li key={room.id} className="flex flex-col border-base-300 border p-5 rounded-2xl">
                <Image
                  src={room.imgUrl || '/placeholder.jpg'}
                  alt={room.name}
                  width={400}
                  height={400}
                  quality={100}
                  className="shadow-sm w-full h-48 object-cover rounded-xl"
                />
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="badge badge-secondary">
                      <Users className="mr-2 w-4" />
                      {room.capacity}
                    </div>
                    <h1 className="font-bold text-xl ml-2">{room.name}</h1>
                  </div>

                  <p className="text-sm my-2 text-gray-500">
                    {room.description.length > 100 ? `${room.description.slice(0, 100)}...` : room.description}
                  </p>

                  <Link className="btn btn-secondary btn-outline btn-sm mt-2" href={`/reservations/${room.id}`}>
                    <SquareArrowOutUpRight className="w-4" />
                    Réserver
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Wrapper>
  );
};

export default Page;
