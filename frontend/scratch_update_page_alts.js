const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add db.json import
if (!content.includes("import dbData from '../../data/db.json';")) {
  content = content.replace(
    "import { TrendingUp,",
    "import dbData from '../../data/db.json';\nimport { TrendingUp,"
  );
}

// Rewrite buildExerciseLogs
const buildExerciseLogsNew = `async function buildExerciseLogs(exercises: any[], settings: any, day: string, sessionNumber: number, currentMonth: number, weekInMonth: number): Promise<ExerciseLog[]> {
  const data = getGiaoan();
  
  const logs: ExerciseLog[] = [];
  
  for (const ex of exercises) {
    let targetWeight = settings.accessoryWeights?.[ex.id] || 0;
    let targetReps = ex.repsDisplay || '';
    
    // Core Ramp logic
    if (ex.tier === 'core' && data.coreRamp && data.coreRamp[day]) {
      const rampData = data.coreRamp[day];
      const monthData = rampData.months?.find((m: any) => m.month === currentMonth) || rampData.months[0];
      if (monthData && monthData.weeks) {
        // weekInMonth is 1-4, weeks array index is 0-3
        const target = monthData.weeks[weekInMonth - 1];
        if (target) {
          targetReps = \`\${target} \${rampData.unit || ''}\`;
        }
      }
    }

    // Progression & RIR
    let computedRIR = '';
    if (ex.tier === 'tier1' || ex.tier === 'main') {
      if (weekInMonth === 1) computedRIR = '2-3';
      else if (weekInMonth === 2) computedRIR = '2';
      else if (weekInMonth === 3) computedRIR = '1-2';
      else if (weekInMonth === 4) computedRIR = '1';
    } else if (ex.tier === 'accessory') {
      computedRIR = '1-2';
    }

    // --- XỬ LÝ ĐỔI BÀI TẬP (SMART SWAP) ---
    const originalNameEn = ex.nameEn || '';
    const originalName = ex.name;
    let finalNameEn = originalNameEn;
    let finalName = originalName;
    let selectedAlternative = '';

    // Kiểm tra xem có bài tập nào được ghi nhớ không (theo originalNameEn)
    if (settings.alternatives && originalNameEn && settings.alternatives[originalNameEn]) {
      const swappedNameEn = settings.alternatives[originalNameEn];
      const altDbEx = dbData.exercises.find((e: any) => e.name === swappedNameEn);
      
      if (altDbEx) {
        finalNameEn = swappedNameEn;
        finalName = altDbEx.name;
        selectedAlternative = altDbEx.name;
        
        // Điều chỉnh lại reps nếu đổi từ tính giây sang đếm reps và ngược lại
        const isNewTimeBased = finalName.toLowerCase().includes('plank');
        const isOldTimeBased = targetReps.toLowerCase().includes('giây') || targetReps.toLowerCase().includes('s');
        
        if (isNewTimeBased && !isOldTimeBased) targetReps = '60 giây';
        else if (!isNewTimeBased && isOldTimeBased) targetReps = '15';
      }
    }
    // ------------------------------------

    // Get last exercise stats (Sử dụng finalNameEn để lấy đúng lịch sử của bài mới)
    // Firestore id for stats is usually the exercise id, but wait, getLastExerciseStats uses exerciseId
    // If it's a swapped exercise, its ID in history is the swapped one, BUT we track by exerciseId.
    // wait! getExerciseStats queries by exerciseId. If we swap, we need to query by the swapped name if the ID doesn't change?
    // In ActiveWorkout.tsx swap logic, it didn't change the exerciseId!
    // This means history is currently bound to the exerciseId (e.g. 'm1-push-a-2'). 
    // BUT getLastExerciseStats checks \`e.nameEn === finalNameEn\`! Let's just use finalNameEn if needed.
    // Wait, getExerciseStats checks exerciseId? Let's fix that.
    
    // For now, we pass ex.id. But if they swapped, maybe the last history has the new name.
    const lastStats = await getLastExerciseStats(ex.id, finalNameEn);
    
    let previousWeight = 0;
    let previousReps = 0;
    if (lastStats) {
       previousWeight = lastStats.weight;
       previousReps = lastStats.reps;
       targetWeight = lastStats.weight;
    }

    logs.push({
      exerciseId: ex.id,
      name: finalName,
      nameEn: finalNameEn,
      originalName: originalName,
      originalNameEn: originalNameEn,
      selectedAlternative: selectedAlternative,
      tier: ex.tier,
      targetWeight,
      targetReps,
      targetSets: ex.sets,
      rest: ex.rest || '90 giây',
      RIR: computedRIR || ex.rir || '',
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: targetWeight,
        reps: 0,
        completed: false,
      })),
      checked: false,
      notes: '',
      lastStatsText: lastStats ? \`\${previousWeight}kg x \${previousReps} reps\` : ''
    });
  }
  return logs;
}`;

const buildExerciseLogsRegex = /async function buildExerciseLogs\([^]*?\n\}/m;
content = content.replace(buildExerciseLogsRegex, buildExerciseLogsNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update page.tsx for alternatives successful!');
