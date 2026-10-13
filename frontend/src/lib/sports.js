// League data for the NBA / NFL / MLB team picker pages: conference (league), division and team colour.
// Used for the conference/division filter chips; colours paint each slice in the team's main colour.

const T = (rows) => rows.map(([name, color]) => ({ name, color }))

export const LEAGUES = {
  'nba-team-picker': {
    label: 'NBA',
    groups: [
      { key: 'East', label: 'Eastern Conference', divisions: {
        Atlantic: T([['Boston Celtics', '#007A33'], ['Brooklyn Nets', '#000000'], ['New York Knicks', '#006BB6'], ['Philadelphia 76ers', '#ED174C'], ['Toronto Raptors', '#CE1141']]),
        Central: T([['Chicago Bulls', '#CE1141'], ['Cleveland Cavaliers', '#860038'], ['Detroit Pistons', '#1D42BA'], ['Indiana Pacers', '#FDBB30'], ['Milwaukee Bucks', '#00471B']]),
        Southeast: T([['Atlanta Hawks', '#E03A3E'], ['Charlotte Hornets', '#00788C'], ['Miami Heat', '#98002E'], ['Orlando Magic', '#0077C0'], ['Washington Wizards', '#002B5C']]),
      } },
      { key: 'West', label: 'Western Conference', divisions: {
        Northwest: T([['Denver Nuggets', '#0E2240'], ['Minnesota Timberwolves', '#236192'], ['Oklahoma City Thunder', '#007AC1'], ['Portland Trail Blazers', '#E03A3E'], ['Utah Jazz', '#753BBD']]),
        Pacific: T([['Golden State Warriors', '#FFC72C'], ['LA Clippers', '#C8102E'], ['Los Angeles Lakers', '#552583'], ['Phoenix Suns', '#E56020'], ['Sacramento Kings', '#5A2D81']]),
        Southwest: T([['Dallas Mavericks', '#00538C'], ['Houston Rockets', '#CE1141'], ['Memphis Grizzlies', '#5D76A9'], ['New Orleans Pelicans', '#0C2340'], ['San Antonio Spurs', '#8A8D8F']]),
      } },
    ],
  },
  'nfl-team-picker': {
    label: 'NFL',
    groups: [
      { key: 'AFC', label: 'AFC', divisions: {
        'AFC East': T([['Buffalo Bills', '#00338D'], ['Miami Dolphins', '#008E97'], ['New England Patriots', '#002244'], ['New York Jets', '#125740']]),
        'AFC North': T([['Baltimore Ravens', '#241773'], ['Cincinnati Bengals', '#FB4F14'], ['Cleveland Browns', '#311D00'], ['Pittsburgh Steelers', '#FFB612']]),
        'AFC South': T([['Houston Texans', '#03202F'], ['Indianapolis Colts', '#002C5F'], ['Jacksonville Jaguars', '#006778'], ['Tennessee Titans', '#4B92DB']]),
        'AFC West': T([['Denver Broncos', '#FB4F14'], ['Kansas City Chiefs', '#E31837'], ['Las Vegas Raiders', '#000000'], ['Los Angeles Chargers', '#0080C6']]),
      } },
      { key: 'NFC', label: 'NFC', divisions: {
        'NFC East': T([['Dallas Cowboys', '#041E42'], ['New York Giants', '#0B2265'], ['Philadelphia Eagles', '#004C54'], ['Washington Commanders', '#5A1414']]),
        'NFC North': T([['Chicago Bears', '#C83803'], ['Detroit Lions', '#0076B6'], ['Green Bay Packers', '#203731'], ['Minnesota Vikings', '#4F2683']]),
        'NFC South': T([['Atlanta Falcons', '#A71930'], ['Carolina Panthers', '#0085CA'], ['New Orleans Saints', '#D3BC8D'], ['Tampa Bay Buccaneers', '#D50A0A']]),
        'NFC West': T([['Arizona Cardinals', '#97233F'], ['Los Angeles Rams', '#003594'], ['San Francisco 49ers', '#AA0000'], ['Seattle Seahawks', '#69BE28']]),
      } },
    ],
  },
  'mlb-team-picker': {
    label: 'MLB',
    groups: [
      { key: 'AL', label: 'American League', divisions: {
        'AL East': T([['Baltimore Orioles', '#DF4601'], ['Boston Red Sox', '#BD3039'], ['New York Yankees', '#0C2340'], ['Tampa Bay Rays', '#8FBCE6'], ['Toronto Blue Jays', '#134A8E']]),
        'AL Central': T([['Chicago White Sox', '#27251F'], ['Cleveland Guardians', '#E50022'], ['Detroit Tigers', '#0C2340'], ['Kansas City Royals', '#004687'], ['Minnesota Twins', '#D31145']]),
        'AL West': T([['Athletics', '#003831'], ['Houston Astros', '#EB6E1F'], ['Los Angeles Angels', '#BA0021'], ['Seattle Mariners', '#005C5C'], ['Texas Rangers', '#003278']]),
      } },
      { key: 'NL', label: 'National League', divisions: {
        'NL East': T([['Atlanta Braves', '#CE1141'], ['Miami Marlins', '#00A3E0'], ['New York Mets', '#FF5910'], ['Philadelphia Phillies', '#E81828'], ['Washington Nationals', '#14225A']]),
        'NL Central': T([['Chicago Cubs', '#0E3386'], ['Cincinnati Reds', '#C6011F'], ['Milwaukee Brewers', '#FFC52F'], ['Pittsburgh Pirates', '#FDB827'], ['St. Louis Cardinals', '#C41E3A']]),
        'NL West': T([['Arizona Diamondbacks', '#A71930'], ['Colorado Rockies', '#33006F'], ['Los Angeles Dodgers', '#005A9C'], ['San Diego Padres', '#2F241D'], ['San Francisco Giants', '#FD5A1E']]),
      } },
    ],
  },
}

/** Every filter option for a league: all, each conference, each division. */
export function leagueFilters(slug) {
  const lg = LEAGUES[slug]
  if (!lg) return []
  const all = lg.groups.flatMap((g) => Object.values(g.divisions).flat())
  const out = [{ id: 'all', label: `All ${all.length} teams`, teams: all, level: 0 }]
  lg.groups.forEach((g) => {
    const teams = Object.values(g.divisions).flat()
    out.push({ id: g.key, label: g.label, teams, level: 1 })
    Object.entries(g.divisions).forEach(([d, list]) => out.push({ id: `${g.key}:${d}`, label: d.includes(g.key) ? d : `${d}`, teams: list, level: 2, parent: g.key }))
  })
  return out
}
