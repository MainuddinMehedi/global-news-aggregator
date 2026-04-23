import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const country = searchParams.get('country');

  const where: any = {};
  if (category) where.categories = { some: { name: category } };
  if (country) where.sourceCountry = country;

  const articles = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: { categories: true }
  });

  return NextResponse.json(articles);
}