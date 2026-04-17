import { createWriteStream, existsSync, readdirSync, statSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const DOCS_DIR = join(PROJECT_ROOT, 'docs');
const OUTPUT = join(PROJECT_ROOT, 'docs-export.zip');

// 간단한 ZIP 생성 (native node:zlib 사용, 외부 의존성 없음)
// 실제 ZIP 포맷을 위해 tar.gz 방식으로 출력

async function exportDocs() {
  if (!existsSync(DOCS_DIR)) {
    console.error('docs/ 디렉토리가 없습니다. 먼저 문서를 생성하세요.');
    process.exit(1);
  }

  const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.error('docs/ 에 .md 파일이 없습니다.');
    process.exit(1);
  }

  console.log(`\n📦 문서 내보내기 시작 (${files.length}개 파일)\n`);

  // tar 형식으로 직접 작성 (node 내장만 사용)
  const outputPath = join(PROJECT_ROOT, 'docs-export.tar.gz');
  const gzip = createGzip();
  const out = createWriteStream(outputPath);

  const TAR_BLOCK = 512;

  function padRight(str, len, char = '\0') {
    return str.padEnd(len, char).slice(0, len);
  }

  function numToOctal(num, len) {
    return num.toString(8).padStart(len - 1, '0') + '\0';
  }

  function checksum(header) {
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i];
    return sum;
  }

  function createHeader(filename, size) {
    const header = Buffer.alloc(TAR_BLOCK, 0);
    const name = Buffer.from(padRight(`docs/${filename}`, 100));
    name.copy(header, 0);
    Buffer.from(numToOctal(0o644, 8)).copy(header, 100);   // mode
    Buffer.from(numToOctal(0, 8)).copy(header, 108);         // uid
    Buffer.from(numToOctal(0, 8)).copy(header, 116);         // gid
    Buffer.from(numToOctal(size, 12)).copy(header, 124);     // size
    Buffer.from(numToOctal(Math.floor(Date.now() / 1000), 12)).copy(header, 136); // mtime
    Buffer.from('        ').copy(header, 148);               // checksum placeholder
    header[156] = 0x30;                                       // typeflag = regular file
    Buffer.from('ustar').copy(header, 257);
    Buffer.from(numToOctal(checksum(header), 8)).copy(header, 148);
    return header;
  }

  const chunks = [];

  for (const filename of files) {
    const filePath = join(DOCS_DIR, filename);
    const content = await readFile(filePath);
    const size = statSync(filePath).size;

    const header = createHeader(filename, size);
    chunks.push(header);

    const padded = Math.ceil(size / TAR_BLOCK) * TAR_BLOCK;
    const contentBlock = Buffer.alloc(padded, 0);
    content.copy(contentBlock);
    chunks.push(contentBlock);

    console.log(`  ✅ ${filename} (${(size / 1024).toFixed(1)} KB)`);
  }

  // EOF 블록 (2 × 512 zeros)
  chunks.push(Buffer.alloc(TAR_BLOCK * 2, 0));

  const tarBuffer = Buffer.concat(chunks);

  await new Promise((resolve, reject) => {
    gzip.on('error', reject);
    out.on('error', reject);
    out.on('finish', resolve);
    gzip.pipe(out);
    gzip.end(tarBuffer);
  });

  console.log(`\n✨ 완료!`);
  console.log(`📁 출력 파일: ${outputPath}`);
  console.log(`\n탐색기에서 열기:`);
  console.log(`  file:///${outputPath.replace(/\\/g, '/')}`);
  console.log(`\n압축 해제 (WSL/Linux/Mac):`);
  console.log(`  tar xzf docs-export.tar.gz`);
}

exportDocs().catch((err) => {
  console.error('오류:', err.message);
  process.exit(1);
});
