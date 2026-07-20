const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ActiveWorkout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `<div className="flex gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Mục tiêu</div>
              <div className="font-bold text-white">{ex.targetSets} × {ex.targetReps}</div>
            </div>
            {ex.RIR && (
              <div className="flex-1 border-l border-slate-800 pl-4">
                <div className="text-xs text-slate-500 mb-1">RIR</div>
                <div className="font-bold text-orange-400">{ex.RIR}</div>
              </div>
            )}
            {ex.lastStatsText && (
              <div className="flex-1 border-l border-slate-800 pl-4">
                <div className="text-xs text-slate-500 mb-1">Lần trước</div>
                <div className="font-bold text-emerald-400 text-sm whitespace-nowrap">{ex.lastStatsText}</div>
              </div>
            )}
          </div>`;

const newBlock = `<div className="space-y-3">
            {/* Hướng dẫn PT */}
            {ex.progressionSuggestion && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                <div className="mt-0.5 text-blue-400 text-lg">💡</div>
                <div>
                  <div className="text-sm font-bold text-blue-400 mb-0.5">Phân tích & Đề xuất</div>
                  <div className="text-xs text-blue-300/80 leading-relaxed">{ex.progressionSuggestion.reason}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Lần trước</div>
                <div className="font-mono font-bold text-slate-300 text-sm">
                  {ex.lastStatsText || 'Chưa có'}
                </div>
              </div>
              <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-500/30">
                <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">Hôm nay ({ex.targetSets} hiệp)</div>
                <div className="font-mono font-bold text-white text-sm">
                  {ex.targetWeight > 0 ? \`\${ex.targetWeight}kg × \` : ''}{ex.targetReps}
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] uppercase tracking-wider text-orange-500 font-bold mb-1">Mức tốn sức (RIR)</div>
                <div className="font-mono font-bold text-orange-400 text-sm">
                  {ex.progressionSuggestion?.oldRir && ex.progressionSuggestion.oldRir !== ex.progressionSuggestion.newRir ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-500 line-through text-xs">{ex.progressionSuggestion.oldRir}</span>
                      <span className="text-slate-500 text-[10px]">→</span>
                      {ex.progressionSuggestion.newRir}
                    </span>
                  ) : ex.RIR || 'Không'}
                </div>
              </div>
            </div>
          </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Update ActiveWorkout.tsx UI successful!');
