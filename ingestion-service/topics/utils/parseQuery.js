/**
 * Parse an AI-refined boolean query string into a structured AST and evaluate it.
 *
 * Supports AND, OR, NOT, parentheses (), and exact quoted strings "".
 * Implicit operator between consecutive terms is AND.
 *
 * Example: `(OpenAI OR DeepSeek) AND "product launch"`
 */

export function tokenize(query) {
  const regex = /"([^"]*)"|\(|\)|AND|OR|NOT|[^\s()]+/ig;
  const tokens = [];
  let match;
  while ((match = regex.exec(query)) !== null) {
    if (match[1] !== undefined) {
      tokens.push({ type: 'TERM', value: match[1].toLowerCase() });
    } else {
      const val = match[0].toUpperCase();
      if (['AND', 'OR', 'NOT'].includes(val)) {
        tokens.push({ type: val });
      } else if (val === '(' || val === ')') {
        tokens.push({ type: val });
      } else {
        tokens.push({ type: 'TERM', value: match[0].toLowerCase() });
      }
    }
  }
  return tokens;
}

export function parse(tokens) {
  let pos = 0;

  function parseExpression() {
    return parseOr();
  }

  function parseOr() {
    let node = parseAnd();
    while (pos < tokens.length && tokens[pos].type === 'OR') {
      pos++;
      const right = parseAnd();
      node = { type: 'OR', left: node, right };
    }
    return node;
  }

  function parseAnd() {
    let node = parseTerm();
    // Implicit AND or Explicit AND
    while (pos < tokens.length && tokens[pos].type !== 'OR' && tokens[pos].type !== ')') {
      if (tokens[pos].type === 'AND') {
        pos++;
      }
      const right = parseTerm();
      if (right) {
        node = { type: 'AND', left: node, right };
      } else {
        break; // Stop if no valid right term
      }
    }
    return node;
  }

  function parseTerm() {
    if (pos >= tokens.length) return null;
    
    const token = tokens[pos];
    
    if (token.type === 'NOT') {
      pos++;
      const expr = parseTerm();
      return { type: 'NOT', expr };
    }
    
    if (token.type === '(') {
      pos++;
      const expr = parseExpression();
      if (pos < tokens.length && tokens[pos].type === ')') {
        pos++;
      }
      return expr;
    }
    
    if (token.type === 'TERM') {
      pos++;
      return token;
    }
    
    // Ignore stray operators
    pos++;
    return null;
  }

  const ast = parseExpression();
  return ast;
}

export function evaluateAST(ast, textLower) {
  if (!ast) return true; // empty query matches anything
  
  if (ast.type === 'TERM') {
    return textLower.includes(ast.value);
  }
  if (ast.type === 'AND') {
    return evaluateAST(ast.left, textLower) && evaluateAST(ast.right, textLower);
  }
  if (ast.type === 'OR') {
    return evaluateAST(ast.left, textLower) || evaluateAST(ast.right, textLower);
  }
  if (ast.type === 'NOT') {
    return !evaluateAST(ast.expr, textLower);
  }
  return false;
}

/**
 * Main exported function to evaluate a text against a topic's boolean query.
 */
export function evaluateRelaxed(topic, text) {
  const textLower = text.toLowerCase();
  
  // Combine displayName and userContext for the terms we want to check
  const intentText = `${topic.displayName || ""} ${topic.userContext || ""}`.toLowerCase();
  
  // Tokenize and filter out stop words and short/non-word terms
  const STOP_WORDS = new Set([
    "a", "an", "the", "in", "on", "at", "without", "with", "can", "is", "are", "of", "to", "for",
    "and", "or", "not", "about", "how", "what", "why", "who", "whom", "where", "when", "which",
    "this", "that", "these", "those", "it", "its", "they", "them", "their", "our", "us", "we",
    "you", "your", "i", "my", "me", "he", "she", "him", "her", "his", "has", "have", "had",
    "do", "does", "did", "been", "be", "was", "were", "by", "from", "as", "but", "so", "if", "than"
  ]);

  const words = intentText
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const uniqueWords = Array.from(new Set(words));
  if (uniqueWords.length === 0) return false;

  let matches = 0;
  for (const word of uniqueWords) {
    if (textLower.includes(word)) {
      matches++;
    }
  }

  // Pass if at least 50% of the key intent words are present in the text
  return (matches / uniqueWords.length) >= 0.5;
}

/**
 * Main exported function to evaluate a text against a topic's boolean query.
 */
export function evaluateQuery(topic, text) {
  let strictMatch = false;

  // 1. Try strict keyword evaluation (conceptualKeywords or boolean AST)
  if (topic.conceptualKeywords && Array.isArray(topic.conceptualKeywords) && topic.conceptualKeywords.length > 0) {
     const textToSearch = text.toLowerCase();
     strictMatch = topic.conceptualKeywords.some((group) =>
       group.every((term) => textToSearch.includes(term.toLowerCase())),
     );
  } else {
    const query = topic.aiRefinedQuery || topic.displayName || "";
    if (query) {
      const tokens = tokenize(query);
      const ast = parse(tokens);
      strictMatch = evaluateAST(ast, text.toLowerCase());
    } else {
      strictMatch = true; // empty query matches anything
    }
  }

  if (strictMatch) return true;

  // 2. Fallback to relaxed matching based on displayName and userContext keywords
  return evaluateRelaxed(topic, text);
}

/**
 * Converts the AST into a Prisma where clause for the rawArticle table.
 */
export function astToPrismaWhere(ast) {
  if (!ast) return {};
  
  if (ast.type === 'TERM') {
    return {
      OR: [
        { rawArticle: { title: { contains: ast.value, mode: "insensitive" } } },
        { rawArticle: { contentSnippet: { contains: ast.value, mode: "insensitive" } } }
      ]
    };
  }
  if (ast.type === 'AND') {
    return { AND: [astToPrismaWhere(ast.left), astToPrismaWhere(ast.right)] };
  }
  if (ast.type === 'OR') {
    return { OR: [astToPrismaWhere(ast.left), astToPrismaWhere(ast.right)] };
  }
  if (ast.type === 'NOT') {
    return { NOT: astToPrismaWhere(ast.expr) };
  }
  return {};
}

/**
 * Helper to get Prisma where clause directly from topic.
 */
export function getPrismaWhere(topic) {
  const query = topic.aiRefinedQuery || topic.displayName || "";
  if (!query) return {};
  
  const tokens = tokenize(query);
  const ast = parse(tokens);
  return astToPrismaWhere(ast);
}

/**
 * Legacy export for backward compatibility in cases where it's still imported as parseQuery
 * We export a dummy function that returns an empty array, or you should migrate callers
 * to use evaluateQuery instead.
 */
export function parseQuery(topic) {
  return []; // We no longer return grouped arrays
}
