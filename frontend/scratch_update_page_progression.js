const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update imports
if (!content.includes("getExerciseHistory")) {
  content = content.replace(
    "import { getWorkoutSession, saveWorkoutSession, getCompletedSessionCount, getLastExerciseStats } from '@/lib/firestore';",
    "import { getWorkoutSession, saveWorkoutSession, getCompletedSessionCount, getLastExerciseStats, getExerciseHistory } from '@/lib/firestore';"
  );
}
if (!content.includes("suggestTier1Weight")) {
  content = content.replace(
    "calcTotalVolume, getDayLabel, getSessionLabel",
    "calcTotalVolume, getDayLabel, getSessionLabel, suggestTier1Weight, suggestDoubleProgression"
  );
}

// Rewrite buildExerciseLogs
const buildExerciseLogsRegex = /async function buildExerciseLogs\([^]*?\n\}/m;

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

    // Lấy lịch sử 2 buổi gần nhất của bài tập này
    const history = await getExerciseHistory(ex.id, finalNameEn, 2);
    
    let previousWeight = 0;
    let previousReps = 0;
    if (history.length > 0) {
       previousWeight = history[0].weight;
       previousReps = history[0].reps;
       targetWeight = history[0].weight; // default fallback
    }

    // --- TÍNH TOÁN PROGRESSIVE OVERLOAD ---
    let progressionSuggestion: any = undefined;
    let computedRIR = '';

    if (ex.tier === 'core') {
      computedRIR = '1-2';
    } else if (ex.tier === 'tier1' || ex.tier === 'main') {
      // Tier 1 Logic
      const tier1Sugg = suggestTier1Weight(previousWeight, weekInMonth);
      targetWeight = tier1Sugg.suggestedWeight > 0 ? tier1Sugg.suggestedWeight : targetWeight;
      computedRIR = tier1Sugg.newRir;
      
      progressionSuggestion = {
        suggestedWeight: targetWeight,
        reason: tier1Sugg.reason,
        oldRir: tier1Sugg.oldRir,
        newRir: tier1Sugg.newRir
      };
    } else {
      // Accessory Logic (Double Progression)
      computedRIR = '1-2';
      const maxRepMatch = targetReps.match(/\\d+-(\\d+)/);
      const maxReps = maxRepMatch ? parseInt(maxRepMatch[1], 10) : parseInt(targetReps, 10);
      
      if (maxReps && !isNaN(maxReps)) {
        const lastTwoSessionsSets = history.map(h => h.sets);
        const dpSugg = suggestDoubleProgression(previousWeight, lastTwoSessionsSets, maxReps, 2.5);
        targetWeight = dpSugg.suggestedWeight > 0 ? dpSugg.suggestedWeight : targetWeight;
        
        progressionSuggestion = {
          suggestedWeight: targetWeight,
          reason: dpSugg.reason,
          oldRir: '1-2',
          newRir: '1-2'
        };
      } else {
        progressionSuggestion = {
          suggestedWeight: targetWeight,
          reason: 'Giữ nguyên tạ, tập trung chất lượng chuyển động.',
          oldRir: '1-2',
          newRir: '1-2'
        };
      }
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
      lastStatsText: history.length > 0 ? \`\${previousWeight}kg x \${previousReps} reps\` : '',
      progressionSuggestion
    });
  }
  return logs;
}`;

content = content.replace(buildExerciseLogsRegex, buildExerciseLogsNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update page.tsx progression successful!');
