"use client"

import React, { useEffect, useState } from 'react'
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Wrapper from '../components/Wrapper';
import Image from 'next/image';
import {SquareArrowOutUpRight, Users } from 'lucide-react';
import Link from 'next/link';

const Page = () => {
  const { user } = useKindeBrowserClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');

  const cleanupExpiredReservations = async () => {
    try {
      await fetch('/api/cleanupReservations', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Étape 1 - Dès que l'utilisateur est dispo, on récupère son entreprise
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              famillyName: user.family_name,
              givenName: user.given_name
            })
          });

          const data = await response.json();
          setCompanyId(data.companyId || null);
        } catch (error) {
          console.error('Erreur fetchCompanyId:', error);
          setCompanyId(null);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCompanyId();
  }, [user]);

  // Étape 2 - Dès qu'on a le companyId, on récupère les salles
  useEffect(() => {
    const fetchRooms = async () => {
      if (companyId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/rooms?companyId=${companyId}`);
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des salles.');
          }

          const data = await response.json();
          setRooms(data.rooms);
          setCompanyName(data.companyName);
        } catch (error) {
          console.error('Erreur fetchRooms:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRooms();
  }, [companyId]);

  // Nettoyage des réservations expirées au premier rendu
  useEffect(() => {
    cleanupExpiredReservations();
  }, []);

  // Affichage
  if (loading) {
    return (
      <Wrapper>
        <div className='w-full flex justify-center'>
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div>
        {companyName && (
          <div className="badge badge-secondary badge-outline">
            {companyName}
          </div>
        )}

        <h1 className='text-2xl mb-4'>Réserver une salle</h1>

        {!companyId ? (
          <div>
            Vous n'êtes pas associé à une entreprise.
          </div>
        ) : rooms.length === 0 ? (
          <p>Aucune salle pour votre entreprise.</p>
        ) : (
          <ul className='grid md:grid-cols-3 gap-4'>
            {rooms.map((room) => (
              <li key={room.id} className='flex flex-col border-base-300 border p-5 rounded-2xl'>
                <Image
                  src={room.imgUrl || '/placeholder.jpg'}
                  alt={room.name}
                  width={400}
                  height={400}
                  quality={100}
                  className='shadow-sm w-full h-48 object-cover rounded-xl'
                />
                <div className='mt-4'>
                  <div className='flex items-center'>
                    <div className='badge badge-secondary'>
                      <Users className='mr-2 w-4' />
                      {room.capacity}
                    </div>
                    <h1 className='font-bold text-xl ml-2'>
                      {room.name}
                    </h1>
                  </div>

                  <p className='text-sm my-2 text-gray-500'>
                    {room.description?.length > 100
                      ? `${room.description.slice(0, 100)}...`
                      : room.description}
                  </p>

                  <Link className='btn btn-secondary btn-outline btn-sm mt-2' href={`/reservations/${room.id}`}>
                    <SquareArrowOutUpRight className='w-4' />
                    Reserver
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
