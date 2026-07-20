const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'workout-engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace suggestTier1Weight
const oldTier1 = /export function suggestTier1Weight[\s\S]*?\}\n/m;
const newTier1 = `export function suggestTier1Weight(
  currentWeight: number,
  weekInMonth: number // 1-4
): { suggestedWeight: number; reason: string; oldRir: string; newRir: string } {
  if (weekInMonth === 1) {
    return {
      suggestedWeight: currentWeight,
      reason: \`Tuần 1: Làm quen mức tạ mới của tháng\`,
      oldRir: '1',
      newRir: '2-3',
    };
  }
  if (weekInMonth === 2) {
    return {
      suggestedWeight: currentWeight,
      reason: \`Tuần 2: Củng cố kỹ thuật, đạt đủ reps\`,
      oldRir: '2-3',
      newRir: '2',
    };
  }
  if (weekInMonth === 3) {
    const newWeight = currentWeight > 0 ? Math.ceil(currentWeight * 1.025 / 2.5) * 2.5 : 0;
    return {
      suggestedWeight: newWeight > 0 ? newWeight : currentWeight,
      reason: \`Tuần 3: Bắt đầu đẩy cường độ, tăng nhẹ tạ\`,
      oldRir: '2',
      newRir: '1-2',
    };
  }
  // Tuần 4
  return {
    suggestedWeight: currentWeight,
    reason: \`Tuần 4: Đỉnh điểm (Test), dồn sức làm cơ sở cho tháng sau\`,
    oldRir: '1-2',
    newRir: '1',
  };
}\n`;

content = content.replace(oldTier1, newTier1);

// Replace suggestDoubleProgression
const oldDouble = /export function suggestDoubleProgression[\s\S]*?\}\n/m;
const newDouble = `export function suggestDoubleProgression(
  currentWeight: number,
  lastTwoSessions: SetLog[][], // mảng [[set logs session -2], [set logs session -1]]
  maxRepRange: number,
  increment: number = 2.5
): { suggestedWeight: number; reason: string } {
  if (lastTwoSessions.length < 2) {
    return {
      suggestedWeight: currentWeight,
      reason: 'Chưa đủ 2 buổi dữ liệu để đánh giá tăng tạ.',
    };
  }

  const allSetsReachMax = lastTwoSessions.every(sessionSets =>
    sessionSets.length > 0 && sessionSets.every(s => s.completed && s.reps >= maxRepRange)
  );

  if (allSetsReachMax) {
    const newWeight = currentWeight > 0 ? currentWeight + increment : 0;
    return {
      suggestedWeight: newWeight > 0 ? newWeight : currentWeight,
      reason: \`Đạt \${maxRepRange} reps trong 2 buổi liên tiếp -> Tăng \${increment}kg\`,
    };
  }

  return {
    suggestedWeight: currentWeight,
    reason: \`Chưa đạt max reps trong 2 buổi liên tiếp -> Giữ nguyên tạ\`,
  };
}\n`;

content = content.replace(oldDouble, newDouble);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update workout-engine.ts successful!');
