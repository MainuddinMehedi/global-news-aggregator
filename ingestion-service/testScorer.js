import { scoreFindings } from './topics/scorer.js';

const mockTopic = {
  displayName: "iran-us tension",
  aiRefinedQuery: "iran us tension geopolitics"
};

const mockFindings = [
  { title: "US imposes new sanctions on Iran" },
  { title: "Best places to eat in Tehran" },
  { title: "Diplomatic talks between Washington and Tehran stall" }
];

scoreFindings(mockTopic, mockFindings).then(res => {
  console.log(JSON.stringify(res, null, 2));
});
