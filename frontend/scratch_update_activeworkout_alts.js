const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ActiveWorkout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { getSettings")) {
  content = content.replace(
    "import dbData from '../../data/db.json';",
    "import dbData from '../../data/db.json';\nimport { getSettings, saveSettings, getLastExerciseStats } from '@/lib/firestore';"
  );
}

const oldOnClick = `onClick={() => {
                            const newExercises = [...session.exercises];
                            const currentEx = newExercises[itemIndex];

                            const isNewTimeBased = altName.toLowerCase().includes('plank');
                            const isOldTimeBased = currentEx.targetReps.toLowerCase().includes('giây') || currentEx.targetReps.toLowerCase().includes('s');
                            let newTargetReps = currentEx.targetReps;

                            if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
                            else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

                            const originalNameEn = currentEx.originalNameEn || currentEx.nameEn;
                            const originalName = currentEx.originalName || currentEx.name;

                            newExercises[itemIndex] = {
                              ...currentEx,
                              originalNameEn,
                              originalName,
                              name: altName,
                              nameEn: altNameEn,
                              selectedAlternative: altName,
                              targetReps: newTargetReps
                            };
                            onUpdate({ ...session, exercises: newExercises });
                            setShowSwap(false);
                          }}`;

const newOnClick = `onClick={async () => {
                            const newExercises = [...session.exercises];
                            const currentEx = newExercises[itemIndex];

                            const isNewTimeBased = altName.toLowerCase().includes('plank');
                            const isOldTimeBased = currentEx.targetReps.toLowerCase().includes('giây') || currentEx.targetReps.toLowerCase().includes('s');
                            let newTargetReps = currentEx.targetReps;

                            if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
                            else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

                            const originalNameEn = currentEx.originalNameEn || currentEx.nameEn;
                            const originalName = currentEx.originalName || currentEx.name;

                            // 1. Fetch old stats for the NEW exercise
                            const lastStats = await getLastExerciseStats(currentEx.exerciseId, altNameEn);
                            let targetWeight = currentEx.targetWeight;
                            let lastStatsText = currentEx.lastStatsText;
                            if (lastStats) {
                              targetWeight = lastStats.weight;
                              lastStatsText = \`\${lastStats.weight}kg x \${lastStats.reps} reps\`;
                            } else {
                              targetWeight = 0;
                              lastStatsText = '';
                            }

                            // 2. Update the session in memory
                            newExercises[itemIndex] = {
                              ...currentEx,
                              originalNameEn,
                              originalName,
                              name: altName,
                              nameEn: altNameEn,
                              selectedAlternative: altName,
                              targetReps: newTargetReps,
                              targetWeight: targetWeight,
                              lastStatsText: lastStatsText,
                              sets: currentEx.sets.map(s => ({ ...s, weight: targetWeight }))
                            };
                            onUpdate({ ...session, exercises: newExercises });
                            setShowSwap(false);

                            // 3. Save memory swap to settings
                            const settings = await getSettings();
                            if (settings) {
                              const alts = settings.alternatives || {};
                              
                              // If they swap back to original, remove from alternatives
                              if (altNameEn === originalNameEn) {
                                delete alts[originalNameEn];
                              } else {
                                alts[originalNameEn] = altNameEn;
                              }
                              
                              await saveSettings({ ...settings, alternatives: alts });
                            }
                          }}`;

content = content.replace(oldOnClick, newOnClick);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update ActiveWorkout.tsx successful!');
