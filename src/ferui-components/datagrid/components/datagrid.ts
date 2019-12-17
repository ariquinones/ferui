import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  TemplateRef,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { RowRendererService } from '../services/rendering/row-renderer.service';
import { FuiColumnDefinitions } from '../types/column-definitions';
import { FuiDatagridApiService } from '../services/datagrid-api.service';
import { FuiDatagridColumnApiService } from '../services/datagrid-column-api.service';
import { FuiDatagridOptionsWrapperService } from '../services/datagrid-options-wrapper.service';
import { FuiColumnService } from '../services/rendering/column.service';
import { Column } from './entities/column';
import { ColumnUtilsService } from '../utils/column-utils.service';
import { ScrollbarHelper } from '../services/datagrid-scrollbar-helper.service';
import { FuiDatagridSortService } from '../services/datagrid-sort.service';
import { Subscription } from 'rxjs';
import {
  CellClickedEvent,
  CellContextMenuEvent,
  CellDoubleClickedEvent,
  ColumnEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  DisplayedColumnsWidthChangedEvent,
  FuiDatagridEvents,
  FuiPageChangeEvent,
  FuiSortColumnsEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  ServerSideRowDataChanged,
} from '../events';
import { FuiDatagridDragAndDropService } from '../services/datagrid-drag-and-drop.service';
import { FuiDragEventsService } from '../services/datagrid-drag-events.service';
import { FuiDatagridService } from '../services/datagrid.service';
import { FuiDatagridFilters } from './filters/filters';
import { FuiDatagridPager } from './pager/pager';
import { FuiDatagridEventService } from '../services/event.service';
import { FuiDatagridClientSideRowModel } from './row-models/client-side-row-model';
import { FuiDatagridFilterService } from '../services/datagrid-filter.service';
import { FuiVirtualScrollerComponent } from '../../virtual-scroller/virtual-scroller';
import { FuiRowModel } from '../types/row-model.enum';
import { FuiDatagridServerSideRowModel } from './row-models/server-side-row-model';
import { IDatagridResultObject, IServerSideDatasource } from '../types/server-side-row-model';
import { ColumnKeyCreator } from '../services/column-key-creator';
import { FuiDatagridInfinteRowModel } from './row-models/infinite/infinite-row-model';
import { AutoWidthCalculator } from '../services/rendering/autoWidthCalculator';
import { HeaderRendererService } from '../services/rendering/header-renderer.service';
import { DatagridStateEnum, DatagridStateService } from '../services/datagrid-state.service';
import { HilitorService } from '../../hilitor/hilitor';
import { FuiPagerPage } from '../types/pager';
import { FuiDatagridBodyRowContext } from '../types/body-row-context';
import { FuiActionMenuService } from '../services/action-menu/action-menu.service';

@Component({
  selector: 'fui-datagrid',
  template: `
    <fui-datagrid-filters
      [hidden]="!withHeader"
      [isLoading]="isInitialLoading"
      (heightChange)="onFilterPagerHeightChange($event)"
    >
      <ng-content></ng-content>
    </fui-datagrid-filters>

    <div class="fui-datagrid-root-wrapper" [style.height]="rootWrapperHeight" #rootWrapper>
      <div class="fui-datagrid-root-body-wrapper">
        <div class="fui-datagrid-root-body" role="grid" unselectable="on">
          <fui-datagrid-header unselectable="on" [style.height.px]="rowHeight" [style.min-height.px]="rowHeight">
            <fui-datagrid-header-viewport>
              <fui-datagrid-header-container [style.width.px]="totalWidth + scrollSize">
                <fui-datagrid-header-row [style.width.px]="totalWidth + scrollSize">
                  <fui-datagrid-header-cell
                    unselectable="on"
                    *ngFor="let hColumn of columns; index as i; trackBy: columnTrackByFn"
                    [colIndex]="i"
                    (changeVisibility)="onColumnChangeVisibility($event)"
                    (changeWidth)="onColumnChangeWidth($event)"
                    (resize)="onColumnResize($event)"
                    [rowHeight]="rowHeight"
                    [columnDefinition]="hColumn"
                  ></fui-datagrid-header-cell>
                </fui-datagrid-header-row>
              </fui-datagrid-header-container>
            </fui-datagrid-header-viewport>
          </fui-datagrid-header>

          <fui-datagrid-body
            [isLoading]="isBodyLoading()"
            [isEmptyData]="isEmptyData()"
            [id]="virtualBodyId"
            [headerHeight]="rowHeight"
            unselectable="on"
          >
            <fui-virtual-scroller
              #scroll
              id="testDivId"
              class="fui-datagrid-body-viewport"
              [hideXScrollbar]="true"
              [bufferAmount]="virtualScrollBufferAmount"
              (verticalScroll)="onVerticalScroll()"
              (horizontalScroll)="onCenterViewportScroll()"
              [items]="displayedRows"
              role="presentation"
              unselectable="on"
            >
              <fui-datagrid-action-menu
                *ngIf="actionMenuTemplate"
                [actionMenuTemplate]="actionMenuTemplate"
                [style.height.px]="rowHeight - 2"
                virtualScrollClipperContent
              ></fui-datagrid-action-menu>

              <fui-datagrid-body-row
                *ngFor="let row of scroll.viewPortItems; index as idx; trackBy: rowTrackByFn"
                [data]="row"
                [rowIndex]="idx + scroll.viewPortInfo.startIndex"
                [style.width.px]="totalWidth"
              >
                <fui-datagrid-body-cell
                  *ngFor="let column of getVisibleColumns(); trackBy: columnTrackByIndexFn"
                  unselectable="on"
                  [column]="column"
                  [rowIndex]="idx + scroll.viewPortInfo.startIndex"
                  [rowHeight]="rowHeight"
                  [rowData]="row"
                ></fui-datagrid-body-cell>
              </fui-datagrid-body-row>
            </fui-virtual-scroller>

            <div
              class="fui-datagrid-infinite-loader"
              *ngIf="isInfiniteLoading() && isInfiniteServerSideRowModel()"
              [style.width]="'calc(100% - ' + scrollSize + 'px)'"
              [style.bottom.px]="scrollSize"
            ></div>
          </fui-datagrid-body>

          <div class="fui-datagrid-footer" role="presentation"></div>

          <div
            class="fui-datagrid-horizontal-scroll"
            #horizontalScrollBody
            [style.height.px]="scrollSize"
            [style.min-height.px]="scrollSize"
            [style.max-height.px]="scrollSize"
          >
            <div
              class="fui-datagrid-body-horizontal-scroll-viewport"
              #horizontalScrollViewport
              (scroll)="onFakeHorizontalScroll($event)"
              [style.height.px]="scrollSize"
              [style.min-height.px]="scrollSize"
              [style.max-height.px]="scrollSize"
            >
              <div
                class="fui-datagrid-body-horizontal-scroll-container"
                #horizontalScrollContainer
                [style.width.px]="totalWidth"
                [style.height.px]="scrollSize"
                [style.min-height.px]="scrollSize"
                [style.max-height.px]="scrollSize"
              ></div>
            </div>
            <div
              class="fui-horizontal-right-spacer"
              [style.width.px]="scrollSize"
              [style.min-width.px]="scrollSize"
              [style.max-width.px]="scrollSize"
            ></div>
          </div>
        </div>
      </div>
      <div class="fui-datagrid-pager-wrapper"></div>
    </div>
    <fui-datagrid-pager
      [withFooterPager]="withFooterPager"
      [withFooterItemPerPage]="withFooterItemPerPage"
      [hidden]="!withFooter"
      [rowDataModel]="rowDataModel"
      [isLoading]="isInitialLoading"
      (pagerReset)="pagerReset($event)"
      (heightChange)="onFilterPagerHeightChange($event)"
      (pagerItemPerPage)="onPagerItemPerPageChange($event)"
      [itemPerPage]="maxDisplayedRows"
    >
    </fui-datagrid-pager>

    <clr-icon #iconDelete class="fui-datagrid-dragdrop-icon fui-datagrid-dragdrop-delete" shape="fui-trash"></clr-icon>
    <clr-icon #iconMove class="fui-datagrid-dragdrop-icon fui-datagrid-dragdrop-move" shape="fui-dragndrop"></clr-icon>
    <clr-icon
      #iconLeft
      class="fui-datagrid-dragdrop-icon fui-datagrid-dragdrop-left"
      shape="fui-arrow-thin"
      dir="left"
    ></clr-icon>
    <clr-icon
      #iconRight
      class="fui-datagrid-dragdrop-icon fui-datagrid-dragdrop-right"
      shape="fui-arrow-thin"
      dir="right"
    ></clr-icon>
  `,
  host: {
    class: 'fui-datagrid',
    '[class.fui-datagrid-has-filter]': 'datagridFilters !== undefined',
    '[class.fui-datagrid-has-pager]': 'datagridPager !== undefined',
  },
  providers: [
    AutoWidthCalculator,
    HeaderRendererService,
    ColumnKeyCreator,
    ColumnUtilsService,
    RowRendererService,
    FuiDatagridApiService,
    FuiDatagridColumnApiService,
    FuiDatagridOptionsWrapperService,
    FuiColumnService,
    ScrollbarHelper,
    FuiDragEventsService,
    FuiDatagridDragAndDropService,
    FuiDatagridSortService,
    FuiDatagridService,
    FuiDatagridEventService,
    FuiDatagridFilterService,
    FuiDatagridClientSideRowModel,
    FuiDatagridServerSideRowModel,
    FuiDatagridInfinteRowModel,
    DatagridStateService,
    HilitorService,
    FuiActionMenuService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuiDatagrid implements OnInit, OnDestroy, AfterViewInit {
  @Output() onColumnWidthChange: EventEmitter<ColumnEvent> = new EventEmitter<ColumnEvent>();
  @Output() onColumnResized: EventEmitter<ColumnResizedEvent> = new EventEmitter<ColumnResizedEvent>();
  @Output() onColumnVisibilityChanged: EventEmitter<ColumnVisibleEvent> = new EventEmitter<ColumnVisibleEvent>();
  @Output() onRowClicked: EventEmitter<RowClickedEvent> = new EventEmitter<RowClickedEvent>();
  @Output() onRowDoubleClicked: EventEmitter<RowDoubleClickedEvent> = new EventEmitter<RowDoubleClickedEvent>();
  @Output() onCellClicked: EventEmitter<CellClickedEvent> = new EventEmitter<CellClickedEvent>();
  @Output() onCellDoubleClicked: EventEmitter<CellDoubleClickedEvent> = new EventEmitter<CellDoubleClickedEvent>();
  @Output() onCellContextmenu: EventEmitter<CellContextMenuEvent> = new EventEmitter<CellContextMenuEvent>();

  @Input() withHeader: boolean = true;
  @Input() withFooter: boolean = true;
  @Input() withFooterItemPerPage: boolean = true;
  @Input() withFooterPager: boolean = true;

  @Input() actionMenuTemplate: TemplateRef<FuiDatagridBodyRowContext>;
  @Input() columnDefs: FuiColumnDefinitions[] = [];
  @Input() defaultColDefs: FuiColumnDefinitions = {};
  @Input() headerHeight: number = 50; // In px.
  @Input() rowHeight: number = 50; // In px.
  @Input() datasource: IServerSideDatasource;
  @Input() trackByFn: TrackByFunction<any>;
  @Input('vsBufferAmount') virtualScrollBufferAmount: number = 10;

  @ViewChild('horizontalScrollBody') horizontalScrollBody: ElementRef;
  @ViewChild('horizontalScrollViewport') horizontalScrollViewport: ElementRef;
  @ViewChild('horizontalScrollContainer') horizontalScrollContainer: ElementRef;
  @ViewChild('rootWrapper') rootWrapper: ElementRef;
  @ViewChild('iconMove') iconMove: ElementRef;
  @ViewChild('iconDelete') iconDelete: ElementRef;
  @ViewChild('iconLeft') iconLeft: ElementRef;
  @ViewChild('iconRight') iconRight: ElementRef;
  @ViewChild('scroll') viewport: FuiVirtualScrollerComponent;

  @ViewChild(FuiDatagridFilters) datagridFilters: FuiDatagridFilters;
  @ViewChild(FuiDatagridPager) datagridPager: FuiDatagridPager;

  rootWrapperHeight: string = '100%';
  columns: FuiColumnDefinitions[] = [];
  totalWidth: number;
  scrollSize: number = 0;
  virtualBodyId: string = `fui-body-${new Date().getTime()}`;

  private _rowDataModel: FuiRowModel = FuiRowModel.CLIENT_SIDE;
  private _gridWidth: string = '100%';
  private _gridHeight: string = 'auto';
  private _rowData: any[] = [];
  private _displayedRows: any[] = [];
  private _maxDisplayedRows: number = null;
  private _maxDisplayedRowsFirstLoad: boolean = true;
  private _totalRows: number = 0;
  private _isFirstLoad: boolean = true;
  private gridPanelReady: boolean = false;
  private isAutoGridHeight: boolean = true;
  private userGridHeight: number = 0;
  private subscriptions: Subscription[] = [];
  private highlightSearchTermsDebounce = null;
  private selectedPage: FuiPagerPage;

  constructor(
    private renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private rowRendererService: RowRendererService,
    private datagridOptionsWrapper: FuiDatagridOptionsWrapperService,
    private gridApi: FuiDatagridApiService,
    private columnApi: FuiDatagridColumnApiService,
    private columnUtils: ColumnUtilsService,
    private scrollbarHelper: ScrollbarHelper,
    private sortService: FuiDatagridSortService,
    private filterService: FuiDatagridFilterService,
    private columnService: FuiColumnService,
    private gridPanel: FuiDatagridService,
    private dragAndDropService: FuiDatagridDragAndDropService,
    private eventService: FuiDatagridEventService,
    private clientSideRowModel: FuiDatagridClientSideRowModel,
    private serverSideRowModel: FuiDatagridServerSideRowModel,
    private infiniteRowModel: FuiDatagridInfinteRowModel,
    private stateService: DatagridStateService,
    private hilitor: HilitorService
  ) {}

  getGridApi(): FuiDatagridApiService {
    return this.gridApi;
  }

  getColumnApi(): FuiDatagridColumnApiService {
    return this.columnApi;
  }

  get isLoading(): boolean {
    if (this.isInfiniteServerSideRowModel()) {
      return this.isInfiniteLoading() || this.stateService.hasState(DatagridStateEnum.LOADING);
    } else {
      return this.stateService.hasState(DatagridStateEnum.LOADING);
    }
  }

  set isLoading(value: boolean) {
    if (value === true) {
      this.stateService.setLoading();
    } else {
      this.stateService.setLoaded();
    }
    this.inputGridHeight = 'refresh';
    this.cd.markForCheck();
  }

  @Input('isLoading')
  set isInitialLoading(value: boolean) {
    if (value === true) {
      this.stateService.setInitialLoading();
    } else {
      this.stateService.setInitialLoaded();
    }
    this.rootWrapperHeight = `calc(100% - ${this.getHeaderPagerHeight()}px)`;
    this.inputGridHeight = 'refresh';
    this.cd.markForCheck();
  }

  get isInitialLoading(): boolean {
    return this.stateService.hasState(DatagridStateEnum.INITIAL_LOADING);
  }

  @Input()
  set rowDataModel(value: FuiRowModel) {
    this._rowDataModel = value;
    this.datagridOptionsWrapper.rowDataModel = value;
    this.cd.markForCheck();
  }

  get rowDataModel(): FuiRowModel {
    return this._rowDataModel;
  }

  @Input()
  set maxDisplayedRows(value: number) {
    // Do nothing if the value is the same.
    if (value === this._maxDisplayedRows) {
      return;
    }
    this._maxDisplayedRows = value;

    if (this.isClientSideRowModel() && !this._maxDisplayedRowsFirstLoad) {
      this.refreshGrid();
    } else if (this.isServerSideRowModel() && this.serverSideRowModel) {
      this.serverSideRowModel.limit = value;
    } else if (this.isInfiniteServerSideRowModel() && this.infiniteRowModel) {
      this.infiniteRowModel.refresh(value);
    }
    this.inputGridHeight = 'refresh';
    this._maxDisplayedRowsFirstLoad = false;
  }

  get maxDisplayedRows(): number {
    return this._maxDisplayedRows;
  }

  @HostBinding('style.height')
  get gridHeight(): string {
    return this._gridHeight;
  }

  @Input('gridHeight')
  set inputGridHeight(value: string) {
    // Do nothing if the value is the same.
    if (value !== 'refresh' && value === this._gridHeight) {
      return;
    }
    if (value === 'auto' || value === 'refresh') {
      // This value correspond to two rows of 50px. We will display the loading view.
      const initialLoadHeight: number = this.isInitialLoading ? 100 : 0;
      const emptyDataHeight: number = !this.isInitialLoading && this.isEmptyData() ? 100 : 0;
      const maxDisplayedRows = this.maxDisplayedRows !== null ? this.maxDisplayedRows : 10;
      const totalRows: number = this.totalRows ? this.totalRows : this.displayedRows.length;

      const minRowCount = totalRows < maxDisplayedRows ? totalRows : maxDisplayedRows;
      const fullRowsCount: number = this.serverSideRowModel.limit
        ? minRowCount < this.serverSideRowModel.limit
          ? minRowCount
          : this.serverSideRowModel.limit
        : minRowCount;

      const gridHeight: number =
        fullRowsCount * this.rowHeight +
        this.headerHeight +
        emptyDataHeight +
        initialLoadHeight +
        this.getHeaderPagerHeight() +
        this.scrollSize +
        2;
      this._gridHeight = gridHeight + 'px';
    } else {
      this._gridHeight = value;
    }
    this.rootWrapperHeight = `calc(100% - ${this.getHeaderPagerHeight()}px)`;
    this.cd.markForCheck();
  }

  @HostBinding('style.width')
  get gridWidth(): string {
    return this._gridWidth;
  }

  @Input('gridWidth')
  set inputGridWidth(value: string) {
    this._gridWidth = value;
    this.cd.markForCheck();
  }

  /**
   * The rowData input is only available for client-side rowModel.
   * If you want to use server-side row model, you need to use the datasource.
   * @param rows
   */
  @Input()
  set rowData(rows: Array<any>) {
    if (this.isClientSideRowModel() && rows) {
      this._rowData = rows;
      this.clientSideRowModel.rowData = rows;
    } else {
      this.totalRows = 0;
      this._rowData = [];
    }
    if (this.datagridOptionsWrapper && this.datagridOptionsWrapper.gridOptions) {
      this.datagridOptionsWrapper.gridOptions.rowData = this._rowData;
    }
    this.cd.markForCheck();
  }

  get rowData(): Array<any> {
    return this._rowData;
  }

  /**
   * Gets the sorted rows.
   */
  get displayedRows(): any[] {
    return this._displayedRows;
  }

  /**
   * Rows that are displayed in the table.
   */
  set displayedRows(value: any[]) {
    if (value && value.length > 0) {
      this.stateService.setNotEmpty();
    } else {
      this.stateService.setEmpty();
    }
    this._displayedRows = value;
  }

  get totalRows(): number {
    return this._totalRows;
  }

  set totalRows(value: number) {
    if (value === this._totalRows) {
      return;
    }
    this._totalRows = value;
    this.inputGridHeight = 'refresh';
  }

  ngOnInit(): void {
    // Track all events that needs to be output.
    this.subscriptions.push(
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_ROW_CLICKED).subscribe(event => {
        const ev: RowClickedEvent = event as RowClickedEvent;
        this.onRowClicked.emit(ev);
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_ROW_DOUBLE_CLICKED).subscribe(event => {
        const ev: RowDoubleClickedEvent = event as RowDoubleClickedEvent;
        this.onRowDoubleClicked.emit(ev);
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_CELL_CLICKED).subscribe(event => {
        const ev: CellClickedEvent = event as CellClickedEvent;
        this.onCellClicked.emit(ev);
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_CELL_DOUBLE_CLICKED).subscribe(event => {
        const ev: CellDoubleClickedEvent = event as CellDoubleClickedEvent;
        this.onCellDoubleClicked.emit(ev);
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_CELL_CONTEXT_MENU).subscribe(event => {
        const ev: CellContextMenuEvent = event as CellContextMenuEvent;
        this.onCellContextmenu.emit(ev);
      })
    );

    // If the dev forgot to set the row-model but still add a datasource object,
    // we would assume he wanted to set a basic server-side row model.
    if (this.datasource && this.isClientSideRowModel()) {
      this.rowDataModel = FuiRowModel.SERVER_SIDE;
    }

    this.datagridOptionsWrapper.rowDataModel = this.rowDataModel;

    if (this.gridHeight !== 'auto') {
      this.isAutoGridHeight = false;
      this.userGridHeight = parseInt(this.gridHeight, 10);
    }

    this.setupColumns();
    this.calculateSizes();

    this.subscriptions.push(
      this.gridPanel.isReady.subscribe(isReady => {
        this.gridPanelReady = isReady;
        this.stateService.setInitialized();
        const icons: { [name: string]: HTMLElement } = {};
        icons[FuiDatagridDragAndDropService.ICON_MOVE] = this.iconMove.nativeElement;
        icons[FuiDatagridDragAndDropService.ICON_HIDE] = this.iconDelete.nativeElement;
        icons[FuiDatagridDragAndDropService.ICON_LEFT] = this.iconLeft.nativeElement;
        icons[FuiDatagridDragAndDropService.ICON_RIGHT] = this.iconRight.nativeElement;
        this.dragAndDropService.initIcons(icons);

        // We wire the services to gridAPI and ColumnAPI.
        this.gridApi.init(this.columnService, this.gridPanel);
        this.columnApi.init(this.columnService, this.gridPanel);

        if (this.datasource) {
          if (this.isInfiniteServerSideRowModel()) {
            this.infiniteRowModel.init(this.datasource);
            this.subscriptions.push(
              this.infiniteRowModel.getDisplayedRows().subscribe(displayedRows => {
                this.displayedRows = displayedRows;
                this.cd.markForCheck();
              })
            );
          }
          this.serverSideRowModel.init(this.datasource);
        }

        // By default we're trying to fit the columns width to grid size.
        setTimeout(() => {
          this.gridPanel.sizeColumnsToFit();
          // Setup column services
          this.updateColumnService();
        });
      }),

      // Server-side only
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_PAGER_SELECTED_PAGE).subscribe(event => {
        const ev: FuiPageChangeEvent = event as FuiPageChangeEvent;
        if (ev && ev.page && (!this.selectedPage || (this.selectedPage && ev.page.index !== this.selectedPage.index))) {
          this.selectedPage = ev.page;
          if (this.isInfiniteServerSideRowModel()) {
            this.isLoading = true;
            this.infiniteUpdateParams(ev.page.index);
            this.cd.markForCheck();
          }
        }
        this.highlightSearchTerms();
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_SERVER_ROW_DATA_CHANGED).subscribe(event => {
        const ev: ServerSideRowDataChanged = event as ServerSideRowDataChanged;
        this.renderGridRows(ev.resultObject);
      }),

      // All row-models
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED).subscribe(event => {
        const ev = event as DisplayedColumnsWidthChangedEvent;
        this.calculateSizes();
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_ROW_DATA_CHANGED).subscribe(() => {
        if (this.isClientSideRowModel()) {
          this.onGridRowsUpdated();
        }
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_SORT_COLUMN_CHANGED).subscribe(event => {
        const ev: FuiSortColumnsEvent = event as FuiSortColumnsEvent;
        if (this.isClientSideRowModel()) {
          this.onGridColumnsChanged();
        } else if (this.isServerSideRowModel()) {
          this.serverSideUpdateRows();
        } else if (this.isInfiniteServerSideRowModel()) {
          this.infiniteUpdateParams(0, true);
        }
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_SORT_CHANGED).subscribe(() => {
        if (this.isClientSideRowModel()) {
          this.onGridSort();
        } else if (this.isServerSideRowModel()) {
          this.serverSideUpdateRows();
        } else if (this.isInfiniteServerSideRowModel()) {
          this.infiniteUpdateParams(0, true);
        }
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_FILTER_CHANGED).subscribe(() => {
        if (this.isClientSideRowModel()) {
          this.onGridFilter();
        } else if (this.isServerSideRowModel()) {
          this.serverSideUpdateRows();
        } else if (this.isInfiniteServerSideRowModel()) {
          this.infiniteRowModel.reset();
          this.infiniteUpdateParams(0, true);
        }
      }),
      this.eventService.listenToEvent(FuiDatagridEvents.EVENT_COLUMN_MOVED).subscribe(() => {
        this.cd.markForCheck();
      })
    );

    this.rootWrapperHeight = this.withHeader ? 'calc(100% - 60px)' : '100%';
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = undefined;
    this.eventService.flushListeners();
    if (this.isInfiniteServerSideRowModel()) {
      this.infiniteRowModel.destroy();
    }
  }

  ngAfterViewInit(): void {
    this.gridPanel.eHorizontalScrollBody = this.horizontalScrollBody.nativeElement;
    this.gridPanel.eBodyHorizontalScrollViewport = this.horizontalScrollViewport.nativeElement;
    this.gridPanel.eBodyHorizontalScrollContainer = this.horizontalScrollContainer.nativeElement;
    this.gridPanel.eCenterViewportVsClipper = this.viewport.horizontalScrollClipperElementRef.nativeElement;

    // Setup Hilitor
    this.hilitor.setTargetNode(this.virtualBodyId);
    this.hilitor.setMatchType('open');

    // Because the ngAfterViewInit lifecycle hook is triggered after change detection has completed and the view has been built,
    // We need to make the change asynchronously so that the view will be updated at the next change detection step.
    // Note : We need to execute this within ngAfterViewInit hook because we need to access child class.
    setTimeout(() => {
      this.inputGridHeight = 'refresh';
    });
  }

  pagerReset(reset: boolean) {
    if (reset) {
      // When we update the pager item per page value, we want to reset the displayed rows.
      if (this.isInfiniteServerSideRowModel()) {
        this.displayedRows = [];
      }
    }
  }

  isInfiniteLoading(): boolean {
    if (this.isInfiniteServerSideRowModel() && this.infiniteRowModel) {
      return this.infiniteRowModel.hasLoadingBlock();
    }
    return false;
  }

  isBodyLoading(): boolean {
    if (this.isInitialLoading === true) {
      return true;
    } else {
      return this.isLoading && !this.isInfiniteServerSideRowModel();
    }
  }

  isEmptyData(): boolean {
    return this.stateService.hasState(DatagridStateEnum.EMPTY);
  }

  columnTrackByFn(index: number, column: FuiColumnDefinitions): any {
    return column.field;
  }

  columnTrackByIndexFn(index: number, column: Column): any {
    return column.getColId();
  }

  rowTrackByFn(index: number, instructor: any): any {
    if (this.trackByFn) {
      return this.trackByFn(index, instructor);
    }
    // We try to get identity from most common identifier if we can.
    if (instructor.id || instructor.guid || instructor.uuid) {
      return instructor.id || instructor.guid || instructor.uuid;
    } else {
      // Otherwise, we just return the whole object.
      return instructor;
    }
  }

  onGridRowsUpdated(): void {
    this.clientSideRowModel.doFilter();
  }

  onGridColumnsChanged(): void {
    this.clientSideRowModel.doSort();
  }

  onGridFilter(): void {
    this.clientSideRowModel.doSort();
  }

  onGridSort(): void {
    this.renderGridRows();
  }

  serverSideUpdateRows(forceReset: boolean = false): void {
    this.isLoading = true;
    this.serverSideRowModel.updateRows(forceReset, this.datagridPager.getCurrentPageIndex()).catch(error => {
      throw error;
    });
  }

  infiniteUpdateParams(blockNumber: number = 0, forceUpdate: boolean = false): void {
    this.infiniteRowModel.loadBlocks(blockNumber, forceUpdate);
  }

  renderGridRows(resultObject?: IDatagridResultObject): void {
    this.calculateSizes();
    if (this.isClientSideRowModel()) {
      this.displayedRows = this.clientSideRowModel.rowData;
      this.totalRows = this.clientSideRowModel.getTotalRows();
    } else if (this.isServerSideRowModel()) {
      if (resultObject) {
        this.displayedRows = resultObject.data;
        this.totalRows = resultObject.total;
      }
    } else if (this.isInfiniteServerSideRowModel()) {
      if (resultObject) {
        this.totalRows = resultObject.total;
      }
    }
    if (this.isLoading) {
      this.isLoading = false;
    }
    this.cd.markForCheck();

    if (this.isFirstLoad()) {
      setTimeout(() => {
        this._isFirstLoad = false;
        this.autoSizeColumns();
      }, 100);
    }
    this.highlightSearchTerms();
  }

  getVisibleColumns(): Column[] {
    return this.columnService.getVisibleColumns();
  }

  updateColumnService() {
    this.sortService.sortingColumns = this.columnService.getAllDisplayedColumns();
  }

  onPagerItemPerPageChange(itemPerPage: number) {
    this.maxDisplayedRows = itemPerPage;
  }

  onFakeHorizontalScroll(event: Event): void {
    this.gridPanel.onFakeHorizontalScroll();
  }

  onCenterViewportScroll(): void {
    this.gridPanel.onCenterViewportScroll();
  }

  onVerticalScroll(): void {
    this.gridPanel.onVerticalScroll();
  }

  isClientSideRowModel() {
    return this.rowDataModel === FuiRowModel.CLIENT_SIDE;
  }

  isServerSideRowModel() {
    return this.rowDataModel === FuiRowModel.SERVER_SIDE;
  }

  isInfiniteServerSideRowModel() {
    return this.rowDataModel === FuiRowModel.INFINITE;
  }

  refreshGrid(resetFilters: boolean = false, resetSorting: boolean = false) {
    // We reset all filters by default
    if (resetFilters) {
      this.filterService.resetFilters();
    }
    // We do not reset the sorting columns by default, only if the dev decide to.
    if (resetSorting) {
      this.setupColumns();
      this.sortService.resetColumnsSortOrder();
    }

    this.datagridPager.resetPager();

    if (this.isClientSideRowModel()) {
      const originalRowData = [...this.rowData];
      this.rowData = [];
      this.isLoading = true;
      this.cd.markForCheck();
      setTimeout(() => {
        this.rowData = originalRowData;
        this.isLoading = false;
        this.cd.markForCheck();
      });
    } else if (this.isServerSideRowModel()) {
      this.serverSideRowModel.refresh(this.maxDisplayedRows, this.datasource);
    } else if (this.isInfiniteServerSideRowModel()) {
      this.infiniteRowModel.refresh(this.maxDisplayedRows, this.datasource);
    }
  }

  onColumnChangeVisibility(columnEvent: ColumnVisibleEvent): void {
    if (columnEvent && columnEvent.column) {
      this.autoSizeColumns();
      this.onColumnVisibilityChanged.emit(columnEvent);
    }
  }

  onColumnChangeWidth(columnEvent: ColumnEvent) {
    if (columnEvent && columnEvent.column) {
      this.calculateSizes();
      this.onColumnWidthChange.emit(columnEvent);
    }
  }

  onColumnResize(event: ColumnResizedEvent): void {
    this.calculateSizes();
    this.onColumnResized.emit(event);
  }

  onFilterPagerHeightChange(value: number) {
    this.rootWrapperHeight = `calc(100% - ${this.getHeaderPagerHeight()}px)`;
    this.cd.markForCheck();
  }

  private isGridLoadedOnce(): boolean {
    return (
      !this.stateService.hasState(DatagridStateEnum.EMPTY) &&
      this.stateService.hasState(DatagridStateEnum.LOADED) &&
      this.stateService.hasState(DatagridStateEnum.INITIALIZED)
    );
  }

  private isFirstLoad(): boolean {
    return this.isGridLoadedOnce() && this._isFirstLoad === true;
  }

  private autoSizeColumns() {
    this.columnService.autoSizeAllColumns(this.gridPanel.getCenterContainer());
    this.columnService.updateColumnsPosition();
    this.calculateSizes();
  }

  private highlightSearchTerms() {
    let searchTerms = '';
    if (this.filterService.globalSearchFilter && this.filterService.globalSearchFilter.filter) {
      searchTerms = this.filterService.globalSearchFilter.filter.getFilterValue();
    }

    if (this.highlightSearchTermsDebounce) {
      clearTimeout(this.highlightSearchTermsDebounce);
    }
    this.highlightSearchTermsDebounce = setTimeout(() => {
      if (searchTerms === '') {
        this.hilitor.remove();
      } else {
        this.hilitor.apply(searchTerms);
      }
    }, 50);
  }

  private calculateSizes(): void {
    this.totalWidth = this.columnService.getTotalColumnWidth();
    if (this.scrollbarHelper.getWidth()) {
      this.scrollSize = this.scrollbarHelper.getWidth();
    }
    this.gridPanel.setCenterContainerSize();
    this.cd.markForCheck();
  }

  /**
   * Return the sum of pager height and filters height if any.
   */
  private getHeaderPagerHeight(): number {
    const filterHeight: number =
      this.withHeader && this.datagridFilters.getElementHeight() ? this.datagridFilters.getElementHeight() : 0;
    const pagerHeight: number =
      this.withFooter && !this.isInitialLoading && this.datagridPager.getElementHeight()
        ? this.datagridPager.getElementHeight()
        : 0;
    return filterHeight + pagerHeight;
  }

  private setupColumns(): void {
    this.datagridOptionsWrapper.gridOptions = {
      columnDefs: this.columnDefs,
      defaultColDef: this.defaultColDefs,
      headerHeight: this.headerHeight,
      rowHeight: this.rowHeight,
    };

    const defaultColDef: FuiColumnDefinitions = {
      resizable: true,
      lockPosition: false,
      lockVisible: false,
    };
    this.columns = this.columnDefs.map(colDef => {
      return { ...defaultColDef, ...this.defaultColDefs, ...colDef };
    });
  }
}
