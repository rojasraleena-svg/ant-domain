import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

function stripComments(sql) {
  let out = "";
  let inString = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inString) {
      out += ch;
      if (ch === "'" && next === "'") {
        out += next;
        i += 1;
      } else if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      out += ch;
      continue;
    }

    if (ch === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1;
      out += "\n";
      continue;
    }

    out += ch;
  }

  return out;
}

function extractTuples(sql) {
  const clean = stripComments(sql);
  const tuples = [];
  let inString = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inString) {
      if (ch === "'" && next === "'") {
        i += 1;
      } else if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      continue;
    }

    if (ch === "(") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(clean.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return tuples;
}

function splitFields(tupleText) {
  const inner = tupleText.trim().replace(/^\(/, "").replace(/\)$/, "");
  const fields = [];
  let current = "";
  let inString = false;
  let depth = 0;

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    const next = inner[i + 1];

    if (inString) {
      current += ch;
      if (ch === "'" && next === "'") {
        current += next;
        i += 1;
      } else if (ch === "'") {
        inString = false;
      }
      continue;
    }

    if (ch === "'") {
      inString = true;
      current += ch;
      continue;
    }

    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    if (ch === ")" || ch === "]" || ch === "}") depth -= 1;

    if (ch === "," && depth === 0) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) fields.push(current.trim());
  return fields;
}

function parseQuoted(token) {
  let end = -1;

  for (let i = 1; i < token.length; i += 1) {
    if (token[i] === "'" && token[i + 1] === "'") {
      i += 1;
      continue;
    }

    if (token[i] === "'") {
      end = i;
      break;
    }
  }

  if (end < 0) {
    throw new Error(`Unterminated string token: ${token}`);
  }

  return {
    value: token.slice(1, end).replace(/''/g, "'"),
    rest: token.slice(end + 1).trim(),
  };
}

function parseToken(token) {
  const trimmed = token.trim();

  if (/^null$/i.test(trimmed)) return null;
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);

  if (trimmed.startsWith("'")) {
    const { value, rest } = parseQuoted(trimmed);
    if (!rest) return value;
    if (/^::jsonb$/i.test(rest)) return JSON.parse(value);
    throw new Error(`Unsupported SQL cast: ${rest}`);
  }

  throw new Error(`Unsupported token: ${token}`);
}

function parseSeedFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  const match = sql.match(
    /INSERT INTO species\s*\(([^)]*)\)\s*VALUES([\s\S]*?)ON CONFLICT\s*\(name_lat\)\s*DO NOTHING;/i
  );

  if (!match) {
    throw new Error("Could not find species INSERT block in seed file.");
  }

  const columns = match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return extractTuples(match[2]).map((tuple, index) => {
    const fields = splitFields(tuple);
    if (fields.length !== columns.length) {
      throw new Error(
        `Tuple ${index + 1} has ${fields.length} fields, expected ${columns.length}.`
      );
    }

    const row = {};
    columns.forEach((column, i) => {
      row[column] = parseToken(fields[i]);
    });
    return row;
  });
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const rows = parseSeedFile("supabase/seed-formicinae-extension.sql");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("species")
    .upsert(rows, {
      onConflict: "name_lat",
      ignoreDuplicates: true,
      defaultToNull: false,
    })
    .select("id,name_cn,name_lat");

  if (error) throw error;

  console.log(
    JSON.stringify(
      {
        processed: rows.length,
        insertedOrReturned: data?.length ?? 0,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
