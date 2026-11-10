import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import type { MatchRecord, PlayerProfile } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDatasetPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx'),
    path.resolve(process.cwd(), '..', 'Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx'),
    path.resolve(__dirname, '..', '..', '..', 'Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Could not locate Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx. Checked: ${candidates.join(', ')}`,
  );
}

function formatExcelDate(value: ExcelJS.CellValue): string {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  if (typeof value === 'number') {
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }
  return '';
}

function unwrapCell(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === 'object' && 'result' in value) {
    return (value as ExcelJS.CellFormulaValue).result;
  }
  return value;
}

export interface LoadedDataset {
  playerProfile: PlayerProfile;
  matches: MatchRecord[];
  sourceFile: string;
  loadedAt: string;
}

let cachedDataset: LoadedDataset | null = null;
let cachedMtimeMs = 0;

export async function loadCricketDataset(): Promise<LoadedDataset> {
  const filePath = resolveDatasetPath();
  const stats = fs.statSync(filePath);

  if (cachedDataset && cachedMtimeMs === stats.mtimeMs) {
    return cachedDataset;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const matchSheet = workbook.getWorksheet('Match_Data');
  if (!matchSheet) {
    throw new Error('Missing Match_Data worksheet in dataset workbook.');
  }

  const headers: string[] = [];
  const matches: MatchRecord[] = [];

  matchSheet.eachRow((row, rowNumber) => {
    const rawValues = row.values as ExcelJS.CellValue[];
    // ExcelJS row.values is 1-indexed (index 0 is empty)
    const cells = rawValues.slice(1).map(unwrapCell);

    if (rowNumber === 1) {
      cells.forEach((cell) => headers.push(String(cell ?? '').trim()));
      return;
    }

    if (cells.every((c) => c === null || c === undefined || c === '')) {
      return;
    }

    const rowMap: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      rowMap[header] = cells[idx];
    });

    const record: MatchRecord = {
      Match_ID: String(rowMap['Match_ID'] ?? ''),
      Match_Date: formatExcelDate(rowMap['Match_Date'] as ExcelJS.CellValue),
      Season: Number(rowMap['Season'] ?? 0),
      Format: String(rowMap['Format'] ?? ''),
      Opposition: String(rowMap['Opposition'] ?? ''),
      Venue: String(rowMap['Venue'] ?? ''),
      Innings: Number(rowMap['Innings'] ?? 1),
      Runs: Number(rowMap['Runs'] ?? 0),
      Balls_Faced: Number(rowMap['Balls_Faced'] ?? 0),
      Fours: Number(rowMap['Fours'] ?? 0),
      Sixes: Number(rowMap['Sixes'] ?? 0),
      Dismissal: String(rowMap['Dismissal'] ?? ''),
      Not_Out_Flag: Number(rowMap['Not_Out_Flag'] ?? 0),
      Strike_Rate: Number(rowMap['Strike_Rate'] ?? 0),
      Match_Result: String(rowMap['Match_Result'] ?? ''),
    };

    if (record.Match_ID) {
      matches.push(record);
    }
  });

  const profileSheet = workbook.getWorksheet('Player_Profile');
  let playerProfile: PlayerProfile = {
    Player: 'Harry Brook',
    Full_Name: 'Harry Cherrington Brook',
    Team: 'England',
    Batting_Style: 'Right-hand bat',
    Role: 'Top-order batter',
    Date_of_Birth: '1999-02-22',
    Birthplace: 'Keighley, England',
    Data_Status: 'Synthetic dashboard demonstration data',
  };

  if (profileSheet) {
    const pHeaders: string[] = [];
    profileSheet.eachRow((row, rowNumber) => {
      const cells = (row.values as ExcelJS.CellValue[]).slice(1).map(unwrapCell);
      if (rowNumber === 1) {
        cells.forEach((c) => pHeaders.push(String(c ?? '').trim()));
      } else if (rowNumber === 2) {
        const pMap: Record<string, string> = {};
        pHeaders.forEach((h, idx) => {
          pMap[h] = String(cells[idx] ?? '');
        });
        playerProfile = {
          Player: pMap['Player'] || playerProfile.Player,
          Full_Name: pMap['Full_Name'] || playerProfile.Full_Name,
          Team: pMap['Team'] || playerProfile.Team,
          Batting_Style: pMap['Batting_Style'] || playerProfile.Batting_Style,
          Role: pMap['Role'] || playerProfile.Role,
          Date_of_Birth: pMap['Date_of_Birth'] || playerProfile.Date_of_Birth,
          Birthplace: pMap['Birthplace'] || playerProfile.Birthplace,
          Data_Status: pMap['Data_Status'] || playerProfile.Data_Status,
        };
      }
    });
  }

  cachedDataset = {
    playerProfile,
    matches,
    sourceFile: path.basename(filePath),
    loadedAt: new Date().toISOString(),
  };
  cachedMtimeMs = stats.mtimeMs;

  return cachedDataset;
}
