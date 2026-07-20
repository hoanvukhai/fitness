const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update imports
content = content.replace(
  "import { getWorkoutSession, saveWorkoutSession } from '@/lib/firestore';",
  "import { getWorkoutSession, saveWorkoutSession, getCompletedSessionCount, getLastExerciseStats } from '@/lib/firestore';"
);

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

    // Get last exercise stats
    const lastStats = await getLastExerciseStats(ex.id);
    let previousWeight = 0;
    let previousReps = 0;
    if (lastStats) {
       previousWeight = lastStats.weight;
       previousReps = lastStats.reps;
       targetWeight = lastStats.weight;
    }

    logs.push({
      exerciseId: ex.id,
      name: ex.name,
      nameEn: ex.nameEn || '',
      originalName: ex.name,
      originalNameEn: ex.nameEn || '',
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
      // Add a custom field to store last stats text
      lastStatsText: lastStats ? \`\${previousWeight}kg x \${previousReps} reps\` : ''
    });
  }
  return logs;
}`;

// Replace the old buildExerciseLogs function
// We'll use a regex to replace from "function buildExerciseLogs" up to the end of the function body
const buildExerciseLogsRegex = /function buildExerciseLogs\([^]*?\n\}/m;
content = content.replace(buildExerciseLogsRegex, buildExerciseLogsNew);

// Rewrite loadSession
const loadSessionNew = `  const loadSession = useCallback(async () => {
    if (!settings) return;
    setLoadingSession(true);
    const slot = overrideDay || getTodaySession(settings);
    if (!slot) { setLoadingSession(false); return; }

    const { day, session: sess } = slot;
    const id = generateWorkoutId(todayDate, day, sess);
    let existing = await getWorkoutSession(id);

    if (!existing) {
      // Logic tự động đếm buổi (Session Counting)
      const completedCount = await getCompletedSessionCount(day, sess);
      const sessionNumber = completedCount + 1;
      const cyclePos = (sessionNumber - 1) % 12; // 12 weeks = 1 macrocycle
      const currentMonth = Math.floor(cyclePos / 4) + 1; // 1, 2, or 3
      const weekInMonth = (cyclePos % 4) + 1; // 1, 2, 3, or 4
      const totalWeek = cyclePos + 1;

      const raw = getExercisesForSession(day, sess, currentMonth);
      const logs = await buildExerciseLogs(raw, settings, day, sessionNumber, currentMonth, weekInMonth);
      
      existing = {
        id, date: todayDate,
        day: day as any, session: sess,
        week: totalWeek, month: currentMonth,
        status: 'planned',
        warmup: { done: false },
        exercises: logs,
        cooldown: { done: false },
        durationSeconds: 0, totalVolume: 0,
      };
    } else {
      setElapsedSeconds(existing.durationSeconds || 0);
    }
    setSession(existing);
    setLoadingSession(false);
  }, [settings, overrideDay, todayDate]);`;

const loadSessionRegex = /const loadSession = useCallback\(async \(\) => {[^]*?setLoadingSession\(false\);\n  }, \[settings, overrideDay, todayDate\]\);/m;
content = content.replace(loadSessionRegex, loadSessionNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update page.tsx successful!');
