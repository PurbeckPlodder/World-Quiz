import type { TopicQuizQuestion } from './topicQuizzes';

type Monarch = {
  child: string;
  end: number | null;
  endQuestion?: string;
  fact: string;
  house: string;
  id: string;
  name: string;
  parent: string;
  spouse: string;
  start: number;
  startQuestion?: string;
  successor: string;
};

const monarchs: Monarch[] = [
  { id: 'william-i', name: 'William I', start: 1066, end: 1087, house: 'Norman', parent: 'Robert I, Duke of Normandy', spouse: 'Matilda of Flanders', child: 'Robert Curthose', successor: 'William II', fact: 'He was crowned at Westminster Abbey on Christmas Day 1066.' },
  { id: 'william-ii', name: 'William II', start: 1087, end: 1100, house: 'Norman', parent: 'William I', spouse: 'No recorded spouse', child: 'No known legitimate child', successor: 'Henry I', fact: 'He died after being struck by an arrow while hunting in the New Forest.' },
  { id: 'henry-i', name: 'Henry I', start: 1100, end: 1135, house: 'Norman', parent: 'William I', spouse: 'Matilda of Scotland', child: 'Empress Matilda', successor: 'Stephen', fact: 'His only legitimate son, William Adelin, died in the White Ship disaster.' },
  { id: 'stephen', name: 'Stephen', start: 1135, end: 1154, house: 'Blois', parent: 'Stephen, Count of Blois', spouse: 'Matilda of Boulogne', child: 'Eustace IV, Count of Boulogne', successor: 'Henry II', fact: 'The civil conflict during his reign is often called the Anarchy.' },
  { id: 'henry-ii', name: 'Henry II', start: 1154, end: 1189, house: 'Plantagenet', parent: 'Empress Matilda', spouse: 'Eleanor of Aquitaine', child: 'Richard I', successor: 'Richard I', fact: 'His dispute with Thomas Becket ended with the archbishop’s murder in Canterbury Cathedral.' },
  { id: 'richard-i', name: 'Richard I', start: 1189, end: 1199, house: 'Plantagenet', parent: 'Henry II', spouse: 'Berengaria of Navarre', child: 'No known legitimate child', successor: 'John', fact: 'He spent much of his reign overseas, including on the Third Crusade.' },
  { id: 'john', name: 'John', start: 1199, end: 1216, house: 'Plantagenet', parent: 'Henry II', spouse: 'Isabella of Angoulême', child: 'Henry III', successor: 'Henry III', fact: 'He agreed to the sealing of Magna Carta at Runnymede in 1215.' },
  { id: 'henry-iii', name: 'Henry III', start: 1216, end: 1272, house: 'Plantagenet', parent: 'John', spouse: 'Eleanor of Provence', child: 'Edward I', successor: 'Edward I', fact: 'He rebuilt Westminster Abbey in the Gothic style.' },
  { id: 'edward-i', name: 'Edward I', start: 1272, end: 1307, house: 'Plantagenet', parent: 'Henry III', spouse: 'Eleanor of Castile', child: 'Edward II', successor: 'Edward II', fact: 'He conquered Wales and began the construction of its great ring of castles.' },
  { id: 'edward-ii', name: 'Edward II', start: 1307, end: 1327, house: 'Plantagenet', parent: 'Edward I', spouse: 'Isabella of France', child: 'Edward III', successor: 'Edward III', fact: 'He was deposed in 1327, the first English monarch to be forced from the throne.' },
  { id: 'edward-iii', name: 'Edward III', start: 1327, end: 1377, house: 'Plantagenet', parent: 'Edward II', spouse: 'Philippa of Hainault', child: 'John of Gaunt', successor: 'Richard II', fact: 'His reign saw the beginning of the Hundred Years’ War with France.' },
  { id: 'richard-ii', name: 'Richard II', start: 1377, end: 1399, house: 'Plantagenet', parent: 'Edward, the Black Prince', spouse: 'Anne of Bohemia', child: 'No surviving legitimate child', successor: 'Henry IV', fact: 'The Peasants’ Revolt reached London during his reign in 1381.' },
  { id: 'henry-iv', name: 'Henry IV', start: 1399, end: 1413, house: 'Lancaster', parent: 'John of Gaunt', spouse: 'Mary de Bohun', child: 'Henry V', successor: 'Henry V', fact: 'He was the first English king from the House of Lancaster.' },
  { id: 'henry-v', name: 'Henry V', start: 1413, end: 1422, house: 'Lancaster', parent: 'Henry IV', spouse: 'Catherine of Valois', child: 'Henry VI', successor: 'Henry VI', fact: 'His army won the Battle of Agincourt in 1415.' },
  { id: 'henry-vi', name: 'Henry VI', start: 1422, end: 1471, house: 'Lancaster', parent: 'Henry V', spouse: 'Margaret of Anjou', child: 'Edward of Westminster', successor: 'Edward IV', fact: 'He founded Eton College in 1440 and King’s College, Cambridge, in 1441.' },
  { id: 'edward-iv', name: 'Edward IV', start: 1461, end: 1483, endQuestion: 'Which Yorkist monarch returned to the throne in 1471 and reigned until 1483?', house: 'York', parent: 'Richard, Duke of York', spouse: 'Elizabeth Woodville', child: 'Edward V', successor: 'Richard III', fact: 'His reign was interrupted when Henry VI briefly regained the throne.' },
  { id: 'edward-v', name: 'Edward V', start: 1483, startQuestion: 'Which boy king was proclaimed in 1483 but never crowned?', end: 1483, endQuestion: 'Which 12-year-old king had a brief reign in 1483 and was never crowned?', house: 'York', parent: 'Edward IV', spouse: 'No recorded spouse', child: 'No known child', successor: 'Richard III', fact: 'He disappeared from public view while still a boy.' },
  { id: 'richard-iii', name: 'Richard III', start: 1483, startQuestion: 'Which duke became king in 1483 after the sons of Edward IV were declared illegitimate?', end: 1485, house: 'York', parent: 'Richard, Duke of York', spouse: 'Anne Neville', child: 'Edward of Middleham', successor: 'Henry VII', fact: 'He was the last English king killed in battle, at Bosworth Field.' },
  { id: 'henry-vii', name: 'Henry VII', start: 1485, end: 1509, house: 'Tudor', parent: 'Edmund Tudor, Earl of Richmond', spouse: 'Elizabeth of York', child: 'Henry VIII', successor: 'Henry VIII', fact: 'His victory at Bosworth was followed by his marriage to Elizabeth of York.' },
  { id: 'henry-viii', name: 'Henry VIII', start: 1509, end: 1547, house: 'Tudor', parent: 'Henry VII', spouse: 'Jane Seymour', child: 'Edward VI', successor: 'Edward VI', fact: 'He had six marriages and broke with Rome, establishing royal supremacy over the Church of England.' },
  { id: 'edward-vi', name: 'Edward VI', start: 1547, end: 1553, house: 'Tudor', parent: 'Henry VIII', spouse: 'No recorded spouse', child: 'No known child', successor: 'Mary I', fact: 'He became king at nine years old and reigned during major Protestant reforms.' },
  { id: 'mary-i', name: 'Mary I', start: 1553, end: 1558, house: 'Tudor', parent: 'Henry VIII', spouse: 'Philip II of Spain', child: 'No surviving child', successor: 'Elizabeth I', fact: 'She restored Roman Catholicism as England’s official religion during her reign.' },
  { id: 'elizabeth-i', name: 'Elizabeth I', start: 1558, end: 1603, house: 'Tudor', parent: 'Henry VIII', spouse: 'No recorded spouse', child: 'No known child', successor: 'James I', fact: 'England’s navy helped defeat the Spanish Armada in 1588.' },
  { id: 'james-i', name: 'James I', start: 1603, end: 1625, house: 'Stuart', parent: 'Mary, Queen of Scots', spouse: 'Anne of Denmark', child: 'Charles I', successor: 'Charles I', fact: 'He became king of England in 1603 while already ruling Scotland as James VI.' },
  { id: 'charles-i', name: 'Charles I', start: 1625, end: 1649, house: 'Stuart', parent: 'James I', spouse: 'Henrietta Maria of France', child: 'Charles II', successor: 'Charles II', fact: 'After the Civil Wars, he was tried and executed in 1649.' },
  { id: 'charles-ii', name: 'Charles II', start: 1660, end: 1685, house: 'Stuart', parent: 'Charles I', spouse: 'Catherine of Braganza', child: 'No surviving legitimate child', successor: 'James II', fact: 'The monarchy was restored in 1660 after the period of republican government.' },
  { id: 'james-ii', name: 'James II', start: 1685, end: 1688, house: 'Stuart', parent: 'Charles I', spouse: 'Mary of Modena', child: 'Mary II', successor: 'William III and Mary II', fact: 'He left the throne during the Glorious Revolution of 1688.' },
  { id: 'william-iii', name: 'William III', start: 1689, startQuestion: 'Which Dutch prince became co-monarch with Mary II in 1689?', end: 1702, house: 'Orange-Nassau', parent: 'William II, Prince of Orange', spouse: 'Mary II', child: 'No surviving child', successor: 'Anne', fact: 'He ruled jointly with Mary II until her death in 1694.' },
  { id: 'mary-ii', name: 'Mary II', start: 1689, startQuestion: 'Which daughter of James II was crowned jointly with her husband in 1689?', end: 1694, house: 'Stuart', parent: 'James II', spouse: 'William III', child: 'No surviving child', successor: 'William III as sole monarch', fact: 'She and her husband accepted the English Bill of Rights in 1689.' },
  { id: 'anne', name: 'Anne', start: 1702, end: 1714, house: 'Stuart', parent: 'James II', spouse: 'Prince George of Denmark', child: 'William, Duke of Gloucester', successor: 'George I', fact: 'The Acts of Union brought England and Scotland together as Great Britain in 1707.' },
  { id: 'george-i', name: 'George I', start: 1714, end: 1727, house: 'Hanover', parent: 'Ernest Augustus, Elector of Hanover', spouse: 'Sophia Dorothea of Celle', child: 'George II', successor: 'George II', fact: 'Born in Hanover, he was the first monarch of the House of Hanover.' },
  { id: 'george-ii', name: 'George II', start: 1727, end: 1760, house: 'Hanover', parent: 'George I', spouse: 'Caroline of Ansbach', child: 'Frederick, Prince of Wales', successor: 'George III', fact: 'He was the last British monarch born outside Great Britain.' },
  { id: 'george-iii', name: 'George III', start: 1760, end: 1820, house: 'Hanover', parent: 'Frederick, Prince of Wales', spouse: 'Charlotte of Mecklenburg-Strelitz', child: 'George IV', successor: 'George IV', fact: 'The American colonies declared independence during his reign.' },
  { id: 'george-iv', name: 'George IV', start: 1820, end: 1830, house: 'Hanover', parent: 'George III', spouse: 'Caroline of Brunswick', child: 'Princess Charlotte of Wales', successor: 'William IV', fact: 'Before becoming king, he served for years as Prince Regent during his father’s illness.' },
  { id: 'william-iv', name: 'William IV', start: 1830, end: 1837, house: 'Hanover', parent: 'George III', spouse: 'Adelaide of Saxe-Meiningen', child: 'No surviving legitimate child', successor: 'Victoria', fact: 'The Reform Act of 1832 was passed during his reign.' },
  { id: 'victoria', name: 'Victoria', start: 1837, end: 1901, house: 'Hanover', parent: 'Edward, Duke of Kent', spouse: 'Prince Albert', child: 'Edward VII', successor: 'Edward VII', fact: 'Her reign lasted more than 63 years and gave its name to an era.' },
  { id: 'edward-vii', name: 'Edward VII', start: 1901, end: 1910, house: 'Saxe-Coburg and Gotha', parent: 'Victoria', spouse: 'Alexandra of Denmark', child: 'George V', successor: 'George V', fact: 'He was the first British monarch from the House of Saxe-Coburg and Gotha.' },
  { id: 'george-v', name: 'George V', start: 1910, end: 1936, endQuestion: 'Which king had reigned since 1910 when he died in 1936?', house: 'Windsor', parent: 'Edward VII', spouse: 'Mary of Teck', child: 'Edward VIII', successor: 'Edward VIII', fact: 'In 1917, he changed the royal house name to Windsor during the First World War.' },
  { id: 'edward-viii', name: 'Edward VIII', start: 1936, startQuestion: 'Which king began and ended his reign in 1936 before abdicating?', end: 1936, endQuestion: 'Which king abdicated in 1936 before his scheduled coronation?', house: 'Windsor', parent: 'George V', spouse: 'Wallis Simpson', child: 'No known child', successor: 'George VI', fact: 'He gave up the throne to marry Wallis Simpson.' },
  { id: 'george-vi', name: 'George VI', start: 1936, startQuestion: 'Which monarch took the throne after his brother abdicated in 1936?', end: 1952, house: 'Windsor', parent: 'George V', spouse: 'Elizabeth Bowes-Lyon', child: 'Elizabeth II', successor: 'Elizabeth II', fact: 'He was king during the Second World War and remained in London during the Blitz.' },
  { id: 'elizabeth-ii', name: 'Elizabeth II', start: 1952, end: 2022, house: 'Windsor', parent: 'George VI', spouse: 'Prince Philip', child: 'Charles III', successor: 'Charles III', fact: 'She became the longest-reigning British monarch, serving for more than 70 years.' },
  { id: 'charles-iii', name: 'Charles III', start: 2022, end: null, house: 'Windsor', parent: 'Elizabeth II', spouse: 'Camilla', child: 'Prince William', successor: 'Prince William is heir apparent', fact: 'He was crowned in 2023, the first coronation of a British monarch in the 21st century.' },
];

function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
}

function choices(answer: string, pool: string[]) {
  return shuffle([answer, ...shuffle([...new Set(pool)].filter((value) => value !== answer)).slice(0, 3)]);
}

const monarchNames = monarchs.map((monarch) => monarch.name);
const houses = monarchs.map((monarch) => monarch.house);
const parents = monarchs.map((monarch) => monarch.parent);
const spouses = monarchs.map((monarch) => monarch.spouse);
const children = monarchs.map((monarch) => monarch.child);
const successors = monarchs.map((monarch) => monarch.successor);
const facts = monarchs.map((monarch) => monarch.fact);
const endYears = monarchs.flatMap((monarch) => monarch.end === null ? [] : [String(monarch.end)]);

const royaltyQuestions: TopicQuizQuestion[] = monarchs.flatMap((monarch) => {
  const questions = [
    { answer: monarch.name, pool: monarchNames, question: monarch.startQuestion ?? `Which monarch began a reign in ${monarch.start}?` },
    monarch.end === null
      ? { answer: String(monarch.start), pool: endYears, question: `In which year did ${monarch.name}'s reign begin?` }
      : { answer: monarch.name, pool: monarchNames, question: monarch.endQuestion ?? `Which monarch's reign ended in ${monarch.end}?` },
    { answer: monarch.house, pool: houses, question: `Which royal house did ${monarch.name} belong to?` },
    { answer: monarch.parent, pool: parents, question: `Who was the parent listed for ${monarch.name} in the immediate family tree?` },
    { answer: monarch.spouse, pool: spouses, question: `Who was the spouse of ${monarch.name}?` },
    { answer: monarch.child, pool: children, question: `Which child is listed in the immediate family tree of ${monarch.name}?` },
    { answer: monarch.successor, pool: successors, question: monarch.end === null ? `Who is first in line to succeed ${monarch.name}?` : `Who succeeded ${monarch.name}?` },
    { answer: monarch.fact, pool: facts, question: `Which event or distinction is associated with ${monarch.name}?` },
  ];
  return questions.map((item) => ({
    answer: item.answer,
    fact: monarch.fact,
    factGroup: monarch.id,
    options: choices(item.answer, item.pool),
    question: item.question,
  }));
});

export const royaltyQuestionCount = royaltyQuestions.length;

export function createRoyaltyRound() {
  const questionsByMonarch = new Map<string, TopicQuizQuestion[]>();
  for (const question of royaltyQuestions) {
    const group = questionsByMonarch.get(question.factGroup) ?? [];
    group.push(question);
    questionsByMonarch.set(question.factGroup, group);
  }
  return shuffle([...questionsByMonarch.values()])
    .slice(0, 20)
    .map((questions) => {
      const question = shuffle(questions)[0];
      return { ...question, options: shuffle(question.options) };
    });
}
