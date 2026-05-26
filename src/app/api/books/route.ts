import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

interface BookItem {
  title: string;
  category: string;
  link: string;
}

// 初始化 R2 客户端
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
    // 只请求 books/ 目录下的文件
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: 'books/',
    });
    const response = await s3Client.send(command);
    const fileList: BookItem[] = [];

    if (response.Contents) {
      response.Contents.forEach((item) => {
        if (!item.Key || item.Key.endsWith('/')) return; // 跳过纯文件夹对象
        
        // 【修改点】：增加对 doc/docx 的支持，并忽略大小写
        const lowerKey = item.Key.toLowerCase();
        const isMatch = lowerKey.match(/\.(pdf|doc|docx)$/);
        if (!isMatch) return; 

        // 键名格式类似于: "books/理论物理/u3-chiral.pdf"
        const parts = item.Key.split('/');
        const fileName = parts.pop() || ''; 
        
        // 提取分类：如果文件在子文件夹中，取上一级文件夹名，否则为未分类
        const category = parts.length > 1 ? parts[parts.length - 1] : '未分类';
        
        // 【修改点】：动态去掉各种后缀格式
        const title = fileName.replace(/\.(pdf|doc|docx)$/i, '').replace(/-/g, ' ');
        const link = `${R2_PUBLIC_DOMAIN}/${item.Key}`;
        
        fileList.push({
          title,
          category,
          link,
        });
      });
    }
    return NextResponse.json(fileList);
  } catch (error) {
    console.error('扫描 R2 书库失败:', error);
    return NextResponse.json({ error: '无法读取云端目录' }, { status: 500 });
  }
}