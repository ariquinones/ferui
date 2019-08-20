import { Component, OnInit } from '@angular/core';
import { FuiDatagridBaseFilter } from './base-filter';
import { IDoesFilterPassParams, IFilterParams } from '../interfaces/filter';
import { FilterType } from '../interfaces/filter.enum';

export interface BooleanFormatter {
  (from: string | boolean): boolean;
}

export interface IBooleanFilterParams extends IFilterParams {
  booleanFormatter?: BooleanFormatter;
}

export function DEFAULT_BOOLEAN_FORMATTER(value: string | boolean) {
  switch (value) {
    case 'true':
    case 'yes':
    case true:
      return true;
    default:
      return false;
  }
}

@Component({
  selector: 'fui-datagrid-boolean-filter',
  template: `
    <div class="row">
      <div class="col-3 fui-dg-filters-column-name" unselectable="on">
        {{ getColumnName() }}
      </div>
      <div class="col-3">
        <fui-radio-wrapper>
          <input
            type="radio"
            fuiRadio
            name="fuiFilterBoolean"
            value="true"
            (ngModelChange)="onChange($event)"
            [(ngModel)]="model"
          />
          <label>Truthy</label>
        </fui-radio-wrapper>
      </div>
      <div class="col-3">
        <fui-radio-wrapper>
          <input
            type="radio"
            fuiRadio
            name="fuiFilterBoolean"
            value="false"
            (ngModelChange)="onChange($event)"
            [(ngModel)]="model"
          />
          <label>Falsy</label>
        </fui-radio-wrapper>
      </div>
      <div class="col-3"></div>
    </div>
  `,
  host: {
    class: 'fui-datagrid-boolean-filter container-fluid',
  },
  styles: [
    `
      .col-3 {
        min-height: 59px;
      }

      .fui-radio-wrapper {
        margin: 7px 0 0 0;
      }
    `,
  ],
})
export class FuiDatagridBooleanFilter extends FuiDatagridBaseFilter<IBooleanFilterParams> implements OnInit {
  static DEFAULT_FORMATTER: BooleanFormatter = DEFAULT_BOOLEAN_FORMATTER;
  formatter: BooleanFormatter;
  model: boolean;

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const data: string | boolean = params.data;
    if (data === null && data === undefined && data === '') {
      return false;
    }
    return this.formatter(data) === this.formatter(this.model);
  }

  getFilterType(): FilterType {
    return FilterType.BOOLEAN;
  }

  getFilterOption(): string {
    return null;
  }

  getFilterValue(): any {
    return this.model;
  }

  onChange(value) {
    if (value !== this.model) {
      this.model = value;
    }
    this.addOrRemoveFilter(this.model !== undefined, this);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.formatter = this.filterParams.booleanFormatter
      ? this.filterParams.booleanFormatter
      : FuiDatagridBooleanFilter.DEFAULT_FORMATTER;
    if (this.getFilterService()) {
      const filter = this.getFilterService().getFilterFor(this.column);
      if (filter && filter instanceof FuiDatagridBooleanFilter) {
        this.model = filter.model;
      }
    }
  }
}
