import { NgModule, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeViewClientSideDemo } from './tree-view-client-side-demo';
import { FeruiModule } from '@ferui/components';

const FUI_DEMO_COMPONENTS_DIRECTIVES: Type<any>[] = [TreeViewClientSideDemo];

@NgModule({
  imports: [CommonModule, FormsModule, FeruiModule],
  declarations: [FUI_DEMO_COMPONENTS_DIRECTIVES],
  exports: [FUI_DEMO_COMPONENTS_DIRECTIVES],
})
export class TreeViewDemoModule {}
