import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [RouterLink],
  templateUrl: './history.html',
  styleUrls: ['./history.scss']
})
export class HistoryComponent {}
