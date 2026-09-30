import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface AnimationItem {
  title: string;
  category: string;
  link: string;
}

function getHtmlFiles(dir: string, baseDir: string, category: string = '必修一互动课件'): AnimationItem[] {
  let results: AnimationItem[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath, baseDir, file));
    } else {
      if (file.startsWith('.')) return;
      if (file.match(/\.html?$/i)) {
        const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
        const link = `/html-dong-hua/bi-xiu1/${relativePath}`;
        const title = file.replace(/\.html?$/i, '').replace(/-/g, ' ');
        results.push({ title, category, link });
      }
    }
  });

  return results;
}

export async function GET() {
  try {
    const animationsDir = path.join(process.cwd(), 'public', 'html-dong-hua', 'bi-xiu1');
    const fileList = getHtmlFiles(animationsDir, animationsDir);
    return NextResponse.json(fileList);
  } catch (error) {
    console.error('读取本地 HTML 目录失败:', error);
    return NextResponse.json({ error: '无法读取本地动画目录' }, { status: 500 });
  }
}