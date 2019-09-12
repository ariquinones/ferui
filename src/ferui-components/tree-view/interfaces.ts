export interface TreeNode<T> {
  getData(): TreeNodeData<T>;
  getLabel(): string;
  hasChildren(): Promise<boolean>;
  getChildNodes(): Promise<Array<TreeNode<T>>>;
  hasParent(): boolean;
  getParentNode(): TreeNode<T> | null;
}

export interface TreeNodeDataRetriever<T> {
  hasChildNodes(parent: TreeNode<T>): Promise<boolean>;
  getChildNodeData(parent: TreeNode<T>): Promise<Array<TreeNodeData<T>>>;
}

export interface TreeNodeData<T> {
  data: T;
  label: string;
}

export interface TreeViewEvent<T> {
  getNode(): TreeNode<T>;
  getType(): TreeViewEventType;
}

export enum TreeViewEventType {
  NODE_CLICKED,
  NODE_EXPANDED,
  NODE_COLLAPSED,
  // plus others?
}
