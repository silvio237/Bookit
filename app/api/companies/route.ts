import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ✅ POST : Créer une entreprise
export async function POST(request: Request) {
  try {
    const { email, companyName } = await request.json();

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Email et nom de l\'entreprise sont requis.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const existingCompany = await prisma.company.findUnique({
      where: { name: companyName },
    });

    if (existingCompany) {
      return NextResponse.json(
        { message: 'Une entreprise avec ce nom existe déjà.' },
        { status: 409 }
      );
    }

    const newCompany = await prisma.company.create({
      data: {
        name: companyName,
        createdBy: { connect: { id: user.id } },
      },
    });

    return NextResponse.json(
      { message: 'Entreprise créée avec succès.', company: newCompany },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST /api/companies :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// ✅ GET : Récupérer les entreprises d'un utilisateur
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'L\'email est requis.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
    }

    const companies = await prisma.company.findMany({
      where: { createdById: user.id },
    });

    return NextResponse.json({ companies }, { status: 200 });
  } catch (error) {
    console.error('Erreur GET /api/companies :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// ✅ DELETE : Supprimer une entreprise
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ message: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Détacher les utilisateurs
    await prisma.user.updateMany({
      where: { companyId: id },
      data: { companyId: null },
    });

    // Supprimer les réservations liées
    await prisma.reservation.deleteMany({
      where: { room: { companyId: id } },
    });

    // Supprimer les salles liées
    await prisma.room.deleteMany({
      where: { companyId: id },
    });

    // Supprimer l'entreprise
    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ message: 'Entreprise supprimée avec succès' }, { status: 200 });
  } catch (error) {
    console.error('Erreur DELETE /api/companies :', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// ✅ PATCH : Ajouter ou supprimer un employé
export async function PATCH(request: Request) {
  try {
    const { id, creatorEmail, employeeEmail, action } = await request.json();

    // Vérifier si le créateur existe
    const creator = await prisma.user.findUnique({ where: { email: creatorEmail } });
    if (!creator) {
      return NextResponse.json({ message: 'Créateur non trouvé' }, { status: 404 });
    }

    // Vérifier si l'entreprise existe
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ message: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Vérifier si le créateur est bien l'utilisateur ayant créé l'entreprise
    if (company.createdById !== creator.id) {
      return NextResponse.json(
        { message: 'L\'utilisateur n\'est pas le créateur de l\'entreprise' },
        { status: 403 }
      );
    }

    // Si l'action est d'ajouter un employé
    if (action === 'ADD') {
      let employee = await prisma.user.findUnique({ where: { email: employeeEmail } });

      if (employee?.companyId === company.id) {
        return NextResponse.json(
          { message: `${employeeEmail} est déjà dans l'entreprise` },
          { status: 400 }
        );
      }

      if (employee?.companyId && employee.companyId !== company.id) {
        return NextResponse.json(
          { message: `Cet employé appartient déjà à une autre entreprise.` },
          { status: 400 }
        );
      }

      if (!employee) {
        // Créer un nouvel employé
        employee = await prisma.user.create({
          data: { email: employeeEmail, companyId: company.id },
        });
      } else {
        // Mettre à jour un employé existant
        await prisma.user.update({
          where: { id: employee.id },
          data: { companyId: company.id },
        });
      }

      // Ajouter l'employé à l'entreprise
      await prisma.company.update({
        where: { id: company.id },
        data: {
          employees: { connect: { id: employee.id } },
        },
      });

      return NextResponse.json({ message: 'Employé ajouté avec succès' }, { status: 201 });

    } else if (action === 'DELETE') {
      // Si l'action est de supprimer un employé
      const employee = await prisma.user.findUnique({ where: { email: employeeEmail } });
      if (!employee) {
        return NextResponse.json({ message: 'Employé non trouvé' }, { status: 404 });
      }

      // Retirer l'employé de l'entreprise
      await prisma.company.update({
        where: { id: company.id },
        data: {
          employees: { disconnect: { id: employee.id } },
        },
      });

      return NextResponse.json({ message: 'Employé supprimé avec succès' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Action non reconnue' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erreur PATCH /api/companies :', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
