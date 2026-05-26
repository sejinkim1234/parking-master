export const shareParkingInfo = async (parkingInfo) => {
  if (!parkingInfo) return;

  const diff = Date.now() - parkingInfo.timestamp;
  const totalMinutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const timeStr = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  
  // Format: "내 차는 [B2 위]에 [1시간 40분째] 주차 중이야"
  const text = `내 차는 [${parkingInfo.location}]에 [${timeStr}째] 주차 중이야`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: '차어디 (chaeodi)',
        text: text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다: ' + text);
    }
  } catch (error) {
    console.error('Error sharing:', error);
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다: ' + text);
    } catch (e) {
      console.error('Clipboard error:', e);
      alert('공유 및 복사에 실패했습니다.');
    }
  }
};
