"use client"

import React, { useEffect, useState, useCallback } from 'react'
import Wrapper from '../components/Wrapper';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import Image from 'next/image';
import { CalendarDays, Clock3, Users } from 'lucide-react';

interface Room {
    id: string;
    name: string;
    capacity: number;
    description: string;
    imgUrl: string;
}

interface Reservation {
    id: string;
    room: Room;
    reservationDate: string;
    startTime: string;
    endTime: string;
}

interface ApiResponse {
    reservationWithoutUserId: Reservation[];
}

const Page = () => {
    const { user } = useKindeBrowserClient();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    // Utilisation de useCallback pour éviter la redéfinition de la fonction à chaque rendu
    const fetchReservations = useCallback(async () => {
        if (!user?.email) return;

        try {
            const response = await fetch(`/api/reservations?email=${user.email}`);
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des réservations");
            }
            const data: ApiResponse = await response.json();

            // Vérification défensive
            if (Array.isArray(data.reservationWithoutUserId)) {
                setReservations(data.reservationWithoutUserId);
            } else {
                setReservations([]);
            }
        } catch (error) {
            console.error("Erreur lors du fetch:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]); // Ajout de user?.email comme dépendance

    const cleanupExpiredReservations = async () => {
        try {
            await fetch('/api/cleanupReservations', { method: 'DELETE' });
        } catch (error) {
            console.error("Erreur nettoyage:", error);
        }
    };

    const deleteReservation = async (id: string) => {
        try {
            const response = await fetch('/api/reservations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                await fetchReservations();
            } else {
                console.error("Erreur suppression réservation");
            }
        } catch (error) {
            console.error("Erreur réseau suppression:", error);
        }
    };

    useEffect(() => {
        if (user?.email) {
            fetchReservations();
            cleanupExpiredReservations();
        }
    }, [user?.email, fetchReservations]); // Ajout de fetchReservations dans les dépendances

    return (
        <Wrapper>
            {loading ? (
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <div>
                    <h1 className='text-2xl mb-4'>Mes réservations</h1>
                    {reservations.length === 0 ? (
                        <p>Aucune réservation trouvée.</p>
                    ) : (
                        <ul className='grid md:grid-cols-2 gap-4'>
                            {reservations.map((reservation) => (
                                <li key={reservation.id} className='flex items-center mb-5 border-base-300 border p-5 rounded-2xl w-full h-60'>
                                    <Image
                                        src={reservation.room.imgUrl || '/placeholder.jpg'}
                                        alt={reservation.room.name}
                                        width={400}
                                        height={400}
                                        quality={100}
                                        className='shadow-sm w-1/3 h-full object-cover rounded-xl'
                                    />
                                    <div className='ml-6'>
                                        <div className='flex flex-col md:flex-row md:items-center'>
                                            <div className='badge badge-secondary'>
                                                <Users className='mr-2 w-4' />
                                                {reservation.room.capacity}
                                            </div>
                                            <h1 className='font-bold text-xl ml-2'>
                                                {reservation.room.name}
                                            </h1>
                                        </div>
                                        <div className='my-2'>
                                            <p className='flex'>
                                                <CalendarDays className='w-4 text-secondary' />
                                                <span className='ml-1'>{reservation.reservationDate}</span>
                                            </p>
                                            <p className='flex'>
                                                <Clock3 className='w-4 text-secondary' />
                                                <span className='ml-1'>{reservation.startTime} - {reservation.endTime}</span>
                                            </p>
                                            <button
                                                className='btn btn-outline btn-sm mt-2 btn-secondary'
                                                onClick={() => deleteReservation(reservation.id)}
                                            >
                                                Libérer
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </Wrapper>
    );
};

export default Page;
