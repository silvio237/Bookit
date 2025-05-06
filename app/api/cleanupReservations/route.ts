import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';

export async function DELETE() {  // Suppression de _request ici
  try {
    const now = dayjs();
    const todayStr = now.format('DD/MM/YYYY'); // exemple : "06/05/2025"
    const currentTimeStr = now.format('HH:mm'); // exemple : "14:30"

    const expiredReservations = await prisma.reservation.findMany({
      where: {
        OR: [
          {
            reservationDate: {
              lt: todayStr, // chaîne "DD/MM/YYYY"
            },
          },
          {
            reservationDate: {
              equals: todayStr,
            },
            endTime: {
              lt: currentTimeStr, // chaîne "HH:mm"
            },
          },
        ],
      },
    });

    if (expiredReservations.length > 0) {
      await prisma.reservation.deleteMany({
        where: {
          id: {
            in: expiredReservations.map((r) => r.id),
          },
        },
      });
    }

    return NextResponse.json({ message: 'Expired reservations cleaned up' });
  } catch (error) {
    console.error('Error cleaning up reservations:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
