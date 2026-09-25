const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// BlackBerry-style status: 12-hour time without a zero-padded hour, AM/PM apart.
export function formatStatus(d) {
  const h = d.getHours();
  const h12 = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
    time: `${h12}:${mm}`,
    ampm: h < 12 ? 'AM' : 'PM',
  };
}
