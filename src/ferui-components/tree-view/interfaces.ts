import { TemplateRef } from '@angular/core';

/**
 * Tree Node Data Interface
 */
export interface TreeNodeData<T> {
  data: T;
  label: string;
}

/**
 * Paging Params Interface
 */
export interface PagingParams {
  offset: number;
  limit: number;
}

/**
 * Tree Node Data Retriever Interface for client-side tree view
 */
export interface TreeNodeDataRetriever<T> {
  getChildNodeData(parent: TreeNode<T>): Promise<Array<TreeNodeData<T>>>;
  hasChildNodes(parent: TreeNode<T>): Promise<boolean>;
  // based on the current TreeNode and its status, we allow the developer to give us an icon template
  getIconTemplate?(treeNode: TreeNode<T>): TemplateRef<any>;
  // If developer wishes to give us a template ref we shall render this template in the view
  getNodeTemplate?(): TemplateRef<any>;
}

/**
 * Paged Tree Node Data Retriever for server-side tree view
 */
export interface PagedTreeNodeDataRetriever<T> extends TreeNodeDataRetriever<T> {
  getPagedChildNodeData(parent: TreeNode<T>, pagingParams: PagingParams): Promise<Array<TreeNodeData<T>>>;
}

/**
 * Tree Node Interface
 */
export interface TreeNode<T> {
  data: TreeNodeData<T>;
  selected: boolean;
  expanded: boolean;
  children: Array<TreeNode<T>>;
  allChildrenLoaded: boolean;
  parent: TreeNode<T> | null;
  showLoader: boolean;
  loadError: boolean;
}

/**
 * Non root tree node empty instance
 */
export class NonRootTreeNode<T> implements TreeNodeData<T> {
  data: T;
  label: string;
}

/**
 * Tree View Event Interface
 */
export interface TreeViewEvent<T> {
  getNode(): TreeNode<T>;
  getType(): TreeViewEventType;
}

/**
 * Tree View Event Type enum
 */
export enum TreeViewEventType {
  NODE_CLICKED,
  NODE_EXPANDED,
  NODE_COLLAPSED,
}

/**
 * Tree View Configuration Interface
 */
export interface TreeViewConfiguration {
  width?: string;
  height?: string;
  hasBorders?: boolean;
  // Color config lets the developer choose the entire color combo for the Tree View component based on 3 given themes
  colorVariation?: TreeViewColorTheme;
  // Buffer amount set by developer, use iland default if not given
  bufferAmount?: number;
}

/**
 * Tree View Color Theme enum of possible options
 */
export type TreeViewColorTheme = 'DARK_BLUE' | 'LIGHT_BLUE' | 'WHITE';

/**
 * Tree View Component Styles Interface
 */
export interface FuiTreeViewComponentStyles {
  width: string;
  height: string;
}
