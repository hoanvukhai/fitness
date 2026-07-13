'use server'

import fs from 'fs'
import path from 'path'

// Path to the JSON database
const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

export async function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { exercises: [], templates: [], sessions: [], metrics: [] }
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error("Failed to read DB:", error)
    return { exercises: [], templates: [], sessions: [], metrics: [] }
  }
}

export async function writeDb(data: any) {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    console.error("Failed to write DB:", error)
    return { success: false, error }
  }
}
