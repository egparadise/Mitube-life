import { Platform } from 'react-native';

import { useStore } from '@/store/store';
import { Backup, backupFileName, BackupError, makeBackup, parseBackup } from '@/utils/backup-format';

/**
 * 파일 저장·열기는 지금은 웹(브라우저)에서만 된다.
 * 화면에서는 마운트된 뒤에 이 값을 보고 버튼을 보여 줘야 미리 만든 HTML 과 첫 화면이 어긋나지 않는다.
 */
export const BACKUP_SUPPORTED = Platform.OS === 'web';
const inBrowser = () => BACKUP_SUPPORTED && typeof document !== 'undefined';

/** 지금 이 기기의 분류함·채널·알림·최근 영상을 JSON 파일로 내려받는다. 담긴 채널 수를 돌려준다. */
export function downloadBackup(): number {
  if (!inBrowser()) throw new BackupError('파일 내보내기는 웹에서만 할 수 있어요.');
  const s = useStore.getState();
  const backup = makeBackup(s);
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return backup.channels.length;
}

/** 파일 고르기 창을 띄워 백업 파일을 읽고 검사한다. 취소하면 null. */
export function pickBackup(): Promise<Backup | null> {
  if (!inBrowser()) return Promise.reject(new BackupError('파일 가져오기는 웹에서만 할 수 있어요.'));
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > 30 * 1024 * 1024) return reject(new BackupError('파일이 너무 커요.'));
      file
        .text()
        .then((text) => resolve(parseBackup(text)))
        .catch(reject);
    };
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/** 검사를 마친 백업으로 이 기기의 분류를 바꾼다. */
export function applyBackup(b: Backup) {
  useStore.getState().restoreBackup(b);
}
