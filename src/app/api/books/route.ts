import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// 🚀 核心修复：强制 Next.js 每次都实时拉取云端数据，绝不使用本地死缓存
export const dynamic = 'force-dynamic';

interface BookItem {
  title: string;
  category: string;
  link: string;
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET() {
  try {
    const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_URL;
    
    // 只扫描 books/ 文件夹
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'books/',
    });

    const response = await s3Client.send(command);
    const fileList: BookItem[] = [];

    if (response.Contents) {
      response.Contents.forEach((item) => {
        if (!item.Key || item.Key.endsWith('/')) return; 

        // ✅ 升级：支持 PDF 以及 WORD 文档，忽略大小写
        const isMatch = item.Key.match(/\.(pdf|doc|docx)$/i);
        if (!isMatch) return;

        const parts = item.Key.split('/');
        const fileName = parts.pop() || '';
        
        const category = parts.length > 1 ? parts[parts.length - 1] : '未分类';
        const title = fileName.replace(/\.(pdf|doc|docx)$/i, '').replace(/-/g, ' ');
        const link = `${R2_PUBLIC_DOMAIN}/${item.Key}`;

        fileList.push({ title, category, link });
      });
    }

    return NextResponse.json(fileList);
  } catch (error) {
    console.error('扫描 R2 书库失败:', error);
    return NextResponse.json({ error: '无法读取云端目录' }, { status: 500 });
  }
}