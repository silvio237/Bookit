import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ReservationRequest {
    email: string;
    roomId: string;
    reservationDate: string;
    timeSlots: string[];
}

// Type personnalisé pour retirer userId de la réponse
type SafeReservation = {
    id: string;
    roomId: string;
    reservationDate: string;
    startTime: string;
    endTime: string;
    room: {
        id: string;
        name: string;
        capacity: number;
    };
};

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const { email, roomId, reservationDate, timeSlots }: ReservationRequest = JSON.parse(body);

        if (!email || !roomId || !reservationDate || !Array.isArray(timeSlots)) {
            return NextResponse.json({ message: 'Champs manquants ou invalides.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        const reservations = await Promise.all(
            timeSlots.map((slot) => {
                if (!slot.includes(' - ')) {
                    throw new Error(`Créneau invalide : ${slot}`);
                }
                const [startTime, endTime] = slot.split(' - ');
                return prisma.reservation.create({
                    data: {
                        userId: user.id,
                        roomId,
                        reservationDate,
                        startTime,
                        endTime,
                    },
                });
            })
        );

        return NextResponse.json({ reservations }, { status: 201 });
    } catch (error) {
        console.error('POST /reservations error:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ message: 'Email requis' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                reservations: {
                    include: {
                        room: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const formatted: SafeReservation[] = user.reservations.map((r) => ({
            id: r.id,
            roomId: r.roomId,
            reservationDate: r.reservationDate,
            startTime: r.startTime,
            endTime: r.endTime,
            room: {
                id: r.room.id,
                name: r.room.name,
                capacity: r.room.capacity,
            },
        }));

        return NextResponse.json({ reservations: formatted }, { status: 200 });
    } catch (error) {
        console.error('GET /reservations error:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ message: 'ID de réservation requis' }, { status: 400 });
        }

        const deleted = await prisma.reservation.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Réservation supprimée', reservation: deleted });
    } catch (error) {
        console.error('DELETE /reservations error:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
