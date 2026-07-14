import fs from 'fs';
import path from 'path';
import ExerciseLibraryClient from './ExerciseLibraryClient';

export const metadata = {
  title: 'Thư viện bài tập – PPL Tracker',
  description: 'Danh sách toàn bộ bài tập trong giáo án PPL 2.0',
};

export interface Exercise {
  name: string;
  tier: string;
  pattern: string;
  targetMuscle: string;
  equipment: string;
  environment: string;
  mediaUrl?: string;
  instructions: string;
  alternatives: string[];
}

function loadExercises(): Exercise[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'db.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.exercises || [];
  } catch {
    return [];
  }
}

export default function LibraryPage() {
  const exercises = loadExercises();
  return <ExerciseLibraryClient exercises={exercises} />;
}
