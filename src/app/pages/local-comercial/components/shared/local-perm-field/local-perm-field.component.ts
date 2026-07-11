import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-local-perm-field',
  templateUrl: './local-perm-field.component.html',
  styleUrls: ['./local-perm-field.component.scss'],
  standalone: false,
})
export class LocalPermFieldComponent {
  @Input()
  @HostBinding('class')
  colClass = 'col-12 col-md-4';

  @Input() label = '';
  @Input() icon = 'edit';
  @Input() fieldId = '';
  @Input() show = true;
  @Input() error = '';
}
