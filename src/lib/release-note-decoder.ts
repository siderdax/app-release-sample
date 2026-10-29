export type DetectedEncoding =
  | 'UTF-8 (BOM)'
  | 'UTF-16LE (BOM)'
  | 'UTF-16BE (BOM)'
  | 'UTF-16LE'
  | 'ASCII'
  | 'UTF-8'
  | 'CP949 (EUC-KR)'
  | 'HYBRID (UTF-8 + CP949 혼합)';

function isPureAscii(buf: Uint8Array): boolean {
  for (let i = 0; i < buf.length; i += 1) {
    if (buf[i] >= 0x80) return false;
  }
  return true;
}

function looksLikeUtf16LeNoBom(buf: Uint8Array): boolean {
  if (buf.length < 4 || buf.length % 2 !== 0) return false;
  const samplePairs = Math.min(64, buf.length / 2);
  let zeroHighBytes = 0;
  for (let idx = 0; idx < samplePairs; idx += 1) {
    if (buf[idx * 2 + 1] === 0x00 && buf[idx * 2] !== 0x00) {
      zeroHighBytes += 1;
    }
  }
  return zeroHighBytes / samplePairs > 0.6;
}

function countUtf8HangulTriplets(b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i + 2 < b.length; i += 1) {
    const b0 = b[i];
    const b1 = b[i + 1];
    const b2 = b[i + 2];
    if (
      b0 >= 0xea &&
      b0 <= 0xed &&
      b1 >= 0x80 &&
      b1 <= 0xbf &&
      b2 >= 0x80 &&
      b2 <= 0xbf
    ) {
      count += 1;
      i += 2;
    }
  }
  return count;
}

function countKsx1001HangulPairs(b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i + 1 < b.length; i += 1) {
    const b0 = b[i];
    const b1 = b[i + 1];
    if (b0 >= 0xb0 && b0 <= 0xc8 && b1 >= 0xa1 && b1 <= 0xfe) {
      count += 1;
      i += 1;
    }
  }
  return count;
}

/**
 * 공유폴더 릴리즈 문서(Windows 메모장 CP949, VS Code UTF-8/BOM, 작업자 혼재 Hybrid)를
 * 한글 손실 없이 UTF-8 문자열로 디코딩합니다.
 */
export function decodeDocumentBuffer(buf: Buffer): {
  encoding: DetectedEncoding;
  text: string;
} {
  if (buf.length === 0) {
    return { encoding: 'ASCII', text: '' };
  }

  // 1) BOM 우선 판별
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return {
      encoding: 'UTF-8 (BOM)',
      text: new TextDecoder('utf-8').decode(buf.subarray(3)),
    };
  }

  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return {
      encoding: 'UTF-16LE (BOM)',
      text: new TextDecoder('utf-16le').decode(buf.subarray(2)),
    };
  }

  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return {
      encoding: 'UTF-16BE (BOM)',
      text: new TextDecoder('utf-16be').decode(buf.subarray(2)),
    };
  }

  // 2) BOM 없는 UTF-16LE 휴리스틱
  if (looksLikeUtf16LeNoBom(buf)) {
    return {
      encoding: 'UTF-16LE',
      text: new TextDecoder('utf-16le').decode(buf),
    };
  }

  // 3) 순수 7-bit ASCII
  if (isPureAscii(buf)) {
    return {
      encoding: 'ASCII',
      text: new TextDecoder('utf-8').decode(buf),
    };
  }

  const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
  const nonFatalUtf8 = new TextDecoder('utf-8', { fatal: false });
  const cp949Decoder = new TextDecoder('euc-kr', { fatal: false });

  // 4) 전체 파일이 유효한 UTF-8인지 우선 검증
  try {
    return {
      encoding: 'UTF-8',
      text: strictUtf8.decode(buf),
    };
  } catch {
    // 5) 줄 단위 하이브리드 판별 (UTF-8 한글 3바이트 vs KS X 1001 2바이트 스코어링)
    const lines: string[] = [];
    let utf8NonAsciiLines = 0;
    let cp949NonAsciiLines = 0;

    let start = 0;
    for (let i = 0; i <= buf.length; i += 1) {
      if (i === buf.length || buf[i] === 0x0a) {
        let lineEnd = i;
        if (lineEnd > start && buf[lineEnd - 1] === 0x0d) {
          lineEnd -= 1;
        }
        const lineBuf = buf.subarray(start, lineEnd);

        if (isPureAscii(lineBuf)) {
          lines.push(lineBuf.toString('utf8'));
        } else {
          try {
            const decodedLine = strictUtf8.decode(lineBuf);
            utf8NonAsciiLines += 1;
            lines.push(decodedLine);
          } catch {
            const utf8Score = countUtf8HangulTriplets(lineBuf);
            const cp949Score = countKsx1001HangulPairs(lineBuf);
            if (utf8Score > cp949Score) {
              utf8NonAsciiLines += 1;
              lines.push(nonFatalUtf8.decode(lineBuf));
            } else {
              cp949NonAsciiLines += 1;
              lines.push(cp949Decoder.decode(lineBuf));
            }
          }
        }
        start = i + 1;
      }
    }

    const encoding: DetectedEncoding =
      utf8NonAsciiLines > 0 && cp949NonAsciiLines > 0
        ? 'HYBRID (UTF-8 + CP949 혼합)'
        : utf8NonAsciiLines > 0
          ? 'UTF-8'
          : 'CP949 (EUC-KR)';

    return {
      encoding,
      text: lines.join('\n'),
    };
  }
}
