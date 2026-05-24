import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 0) return 'vừa xong';
    if (seconds < 60) return 'vừa xong';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;

    const years = Math.floor(days / 365);
    return `${years} năm trước`;
  }
}
