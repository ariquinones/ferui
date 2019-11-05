import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {
  TreeViewColorTheme,
  TreeViewConfiguration,
  TreeViewEvent,
  TreeViewEventType,
  TreeNodeData,
  TreeNodeDataRetriever,
  PagedTreeNodeDataRetriever,
  TreeNode,
  FuiTreeViewComponentStyles,
  NonRootTreeNode,
} from './interfaces';
import { FuiVirtualScrollerComponent } from '../virtual-scroller/virtual-scroller';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/internal/operators';

@Component({
  selector: 'fui-tree-view',
  template: `
    <div id="fui-tree-view-component" [ngStyle]="treeViewStyles" [ngClass]="colorTheme">
      <fui-virtual-scroller #scroll class="fui-virtual-scroller" [items]="scrollViewArray" [bufferAmount]="BUFFER_AMOUNT">
        <fui-tree-node
          *ngFor="let node of scroll.viewPortItems"
          [node]="node"
          [theme]="colorTheme"
          [dataRetriever]="dataRetriever"
          (onNodeEvent)="nodeEvent($event)"
        ></fui-tree-node>
      </fui-virtual-scroller>
    </div>
  `,
  styles: [
    `
      #fui-tree-view-component {
        padding: 10px;
      }
      .DARK_BLUE {
        background: #252a3a;
        color: #fff;
      }
      .LIGHT_BLUE {
        background: #03a6ff;
        color: #fff;
      }
      .WHITE {
        background: #f5f8f9;
        color: #252a3a;
      }
      .fui-virtual-scroller {
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class FuiTreeViewComponent<T> implements OnInit, OnDestroy {
  @Input() treeNodeData: TreeNodeData<T>;

  @Input() dataRetriever: TreeNodeDataRetriever<T> | PagedTreeNodeDataRetriever<T>;

  @Input() config: TreeViewConfiguration;

  @ViewChild(FuiVirtualScrollerComponent) vs: FuiVirtualScrollerComponent;

  @Output() onNodeEvent: EventEmitter<TreeViewEvent<any>> = new EventEmitter<TreeViewEvent<any>>();

  treeViewStyles: FuiTreeViewComponentStyles;
  colorTheme: TreeViewColorTheme;
  scrollViewArray: TreeNode<T>[];
  BUFFER_AMOUNT: number = 30;
  private rootNode: TreeNode<T>;
  private nonRootArray: TreeNode<T>[];
  private scrollObservable: Observable<any>;
  private scrollSubscription: Subscription;
  private scrollPromise: boolean = false;
  private SERVER_SIDE_COMPONENT: boolean = false;
  private TREE_NODE_COMPONENT_HEIGHT: number = 34;
  private DEFAULT_WIDTH: string = 'auto';
  private DEFAULT_HEIGHT: string = '100%';
  private DEFAULT_COLOR_THEME: TreeViewColorTheme = 'WHITE';

  constructor() {}

  /**
   * Initializes the Tree View component and all properties needed depending on inputs configuration
   */
  ngOnInit(): void {
    this.SERVER_SIDE_COMPONENT = this.dataRetriever.hasOwnProperty('getPagedChildNodeData');
    this.treeViewStyles = {
      width: this.config.width ? this.config.width : this.DEFAULT_WIDTH,
      height: this.config.height ? this.config.height : this.DEFAULT_HEIGHT,
    };
    this.colorTheme = this.config.colorVariation ? this.config.colorVariation : this.DEFAULT_COLOR_THEME;
    if (this.SERVER_SIDE_COMPONENT) {
      this.BUFFER_AMOUNT = this.config.bufferAmount || this.BUFFER_AMOUNT;
      this.scrollObservable = fromEvent(this.vs.element.nativeElement, 'scroll');
      this.scrollSubscription = this.scrollObservable.pipe(throttleTime(500)).subscribe(() => {
        this.handleScroll(this.vs.viewPortInfo.endIndex);
      });
    }
    if (this.treeNodeData instanceof NonRootTreeNode) {
      const emptyRootNode = this.createTreeNode(this.treeNodeData, null);
      this.dataRetriever.getChildNodeData(emptyRootNode).then(children => {
        this.nonRootArray = children.map(child => {
          return this.createTreeNode(child, null);
        });
        this.scrollViewArray = this.nonRootArray;
      });
    } else {
      this.rootNode = this.createTreeNode(this.treeNodeData, null);
      this.scrollViewArray = [this.rootNode];
    }
  }

  /**
   * Destroys scroll subscription if any
   */
  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  /**
   * Emits the Node Event for outside Tree View Component usage as well as ensures tree nodes properties are updated
   * @param {TreeViewEvent<any>} event
   */
  private nodeEvent(event: TreeViewEvent<T>): void {
    this.onNodeEvent.emit(event);
    switch (event.getType()) {
      case TreeViewEventType.NODE_EXPANDED:
        this.handleExpandNode(event.getNode(), this.vs.viewPortInfo.startIndex, this.vs.viewPortInfo.endIndex);
        break;
      case TreeViewEventType.NODE_COLLAPSED:
        this.handleCollapseNode(event.getNode());
        break;
      case TreeViewEventType.NODE_CLICKED:
        this.selectOneNode(event.getNode());
        break;
      default:
        break;
    }
  }

  /**
   * Selects a TreeNode and deselects all other on the entire Tree View
   * @param {TreeNode<any>} node
   */
  private selectOneNode(node: TreeNode<T>) {
    this.scrollViewArray.forEach(scrollItem => (scrollItem.selected = scrollItem === node));
  }

  private rebuildVirtualScrollerArray() {
    const aggregator = [];
    if (this.rootNode) {
      this.addNodeAndChildrenToVirtualScrollerArray(this.rootNode, aggregator);
    } else {
      for (const child of this.nonRootArray) {
        this.addNodeAndChildrenToVirtualScrollerArray(child, aggregator);
      }
    }
    this.scrollViewArray = aggregator;
  }

  // returns whether the child branch is complete
  private addNodeAndChildrenToVirtualScrollerArray(node: TreeNode<T>, aggregator: Array<TreeNode<T>>): boolean {
    aggregator.push(node);
    for (const child of node.children) {
      if (!this.addNodeAndChildrenToVirtualScrollerArray(child, aggregator)) {
        return false;
      }
    }
    return node.expanded === false || node.allChildrenLoaded;
  }

  private getFirstNodeWithMoreChildrenToLoad(node: TreeNode<T>): TreeNode<T> | null {
    if (node.expanded === true && !node.allChildrenLoaded) {
      return node;
    }
    for (const child of node.children) {
      const childResult = this.getFirstNodeWithMoreChildrenToLoad(child);
      if (childResult !== null) {
        return childResult;
      }
    }
    return null;
  }

  // bind to observable
  private async handleExpandNode(node: TreeNode<T>, firstIdxInView: number, lastIdxInView: number) {
    node.showLoader = node.expanded = true;
    await this.loadMoreNodes(node, this.BUFFER_AMOUNT + lastIdxInView - firstIdxInView, false);
    node.showLoader = false;
    this.rebuildVirtualScrollerArray();
  }

  // bind to observable
  private async handleCollapseNode(node: TreeNode<T>) {
    node.children = [];
    node.expanded = node.showLoader = node.loadError = false;
    node.allChildrenLoaded = false;
    this.rebuildVirtualScrollerArray();
  }

  // bind to observable
  private async handleScroll(lastIdxInView: number) {
    const numberNeeded = this.BUFFER_AMOUNT - (this.scrollViewArray.length - lastIdxInView);
    if (numberNeeded > 0 && !this.scrollPromise) {
      this.scrollPromise = true;
      await this.loadMoreNodes(this.scrollViewArray[lastIdxInView].parent, numberNeeded, true);
      this.rebuildVirtualScrollerArray();
    }
  }

  /**
   * Load more tree nodes.
   *
   * @param numberToLoad the number of new nodes wanted
   * @param {boolean} recurse when true, continues to load up to 'numberToLoad' nodes from the next
   * expanded node that has more children (or the full set of tree nodes is loaded). When false, only
   * attempts to load up to 'numberToLoad' from the first node with an incomplete set of children.
   */
  private async loadMoreNodes(node: TreeNode<T>, numberToLoad: number, recurse: boolean) {
    //const firstNodeWithMoreChildrenToLoad = this.getFirstNodeWithMoreChildrenToLoad(this.rootNode);
    const firstNodeWithMoreChildrenToLoad = this.getFirstNodeWithMoreChildrenToLoad(node);
    if (firstNodeWithMoreChildrenToLoad === null) {
      return;
    }
    let newChildren;
    if (this.SERVER_SIDE_COMPONENT) {
      try {
        newChildren = (await (this.dataRetriever as PagedTreeNodeDataRetriever<T>).getPagedChildNodeData(
          firstNodeWithMoreChildrenToLoad,
          {
            offset: firstNodeWithMoreChildrenToLoad.children.length,
            limit: numberToLoad,
          }
        )).map(it => this.createTreeNode(it, firstNodeWithMoreChildrenToLoad));
      } catch (e) {
        firstNodeWithMoreChildrenToLoad.showLoader = false;
        firstNodeWithMoreChildrenToLoad.loadError = true;
        throw e.message;
      }
    } else {
      newChildren = (await this.dataRetriever.getChildNodeData(firstNodeWithMoreChildrenToLoad)).map(it =>
        this.createTreeNode(it, firstNodeWithMoreChildrenToLoad)
      );
      firstNodeWithMoreChildrenToLoad.allChildrenLoaded = true;
    }
    firstNodeWithMoreChildrenToLoad.children = firstNodeWithMoreChildrenToLoad.children.concat(newChildren);
    this.scrollPromise = false;
    if (newChildren.length < numberToLoad) {
      firstNodeWithMoreChildrenToLoad.allChildrenLoaded = true;
      if (recurse) {
        await this.loadMoreNodes(this.rootNode, numberToLoad - newChildren.length, recurse);
      }
    }
  }

  /**
   * Creates a TreeNode object
   *
   * @param {TreeNodeData<T>} treeNodeData
   * @param {TreeNode<T>} parentTreeNode
   * @returns {TreeNode<T>}
   */
  private createTreeNode(treeNodeData: TreeNodeData<T>, parentTreeNode: TreeNode<T> | null): TreeNode<T> {
    return {
      data: treeNodeData,
      selected: false,
      expanded: false,
      children: [],
      allChildrenLoaded: false,
      parent: parentTreeNode,
      showLoader: false,
      loadError: false,
    };
  }
}
