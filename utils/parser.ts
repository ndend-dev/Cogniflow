
export const parseContent = (content: string): { tags: string[], links: string[] } => {
  const tagRegex = /#(\w+)/g;
  const linkRegex = /\[\[([^\]]+)\]\]/g;

  const tags = [...content.matchAll(tagRegex)].map(match => match[1]);
  const links = [...content.matchAll(linkRegex)].map(match => match[1]);

  return {
    tags: [...new Set(tags)],
    links: [...new Set(links)],
  };
};

export const parseTasks = (content: string): { completed: number, total: number } => {
  if (!content) return { completed: 0, total: 0 };
  // Matches lines like: - [ ] task, * [x] task, - [X] task
  const taskRegex = /^\s*[\-\*] \[( |x|X)\] .*/gm;
  const matches = [...content.matchAll(taskRegex)];
  
  const total = matches.length;
  const completed = matches.filter(match => match[1].toLowerCase() === 'x').length;
  
  return { completed, total };
};
