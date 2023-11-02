export function getDateNDaysAgo(N: number): Date {
	const today = new Date();
	const pastDate = new Date(today);
  
	pastDate.setDate(today.getDate() - N);
  
	return pastDate;
  }