import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ReservationRequest {
  email: string;
  roomId: string;
  reservationDate: string;
  timeSlots: string[];
}

interface DeleteRequestBody {
  id: string;
}

interface ReservationResponse {
  id: string;
  roomId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  userId: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const { email, roomId, reservationDate, timeSlots }: ReservationRequest = JSON.parse(body);

    if (!email || !roomId || !reservationDate || !Array.isArray(timeSlots)) {
      return NextResponse.json({ message: 'Tous les champs sont requis et timeSlots doit être un tableau.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const reservations: ReservationResponse[] = await Promise.all(
      timeSlots.map(async (slot): Promise<ReservationResponse> => {
        if (!slot.includes(' - ')) {
          throw new Error(`Format de créneau invalide : ${slot}`);
        }

        const [startTime, endTime] = slot.split(' - ').map((s) => s.trim());

        const reservation = await prisma.reservation.create({
          data: {
            userId: user.id,
            roomId,
            reservationDate,
            startTime,
            endTime,
          },
        });

        return reservation;
      })
    );

    return NextResponse.json({ reservations }, { status: 201 });
  } catch (error) {
    console.error('Error in API POST /reservations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email manquant' }, { status: 400 });
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

    const reservationWithoutUserId = user.reservations.map(({ userId, ...rest }) => rest);

    return NextResponse.json({ reservationWithoutUserId }, { status: 200 });
  } catch (error) {
    console.error('Error in API GET /reservations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id }: DeleteRequestBody = await request.json();

    if (!id) {
      return NextResponse.json({ message: "L'ID de la réservation est requis" }, { status: 400 });
    }

    const deletedReservation = await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Réservation supprimée avec succès', deletedReservation });
  } catch (error) {
    console.error('Error in API DELETE /reservations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
