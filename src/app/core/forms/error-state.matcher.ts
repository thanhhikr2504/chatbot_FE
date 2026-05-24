import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class DirtyOrSubmittedErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    if (!control || !control.invalid) return false;
    return control.dirty || !!form?.submitted;
  }
}

export const dirtyOrSubmittedErrorStateMatcher = new DirtyOrSubmittedErrorStateMatcher();
