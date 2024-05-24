
import { AfterViewInit, Component, Inject, OnInit,ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { SharedModule } from '../shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Team } from '../../models/team.model';
import { TeamService } from './team.service';
type ActionType = 'new' | 'edit' | 'delete';
@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export default class TeamsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['teamName', 'teamImage', 'actions'];
  class: string = ""
  title: string = "Listado de equipos"
  pageSizeOptions: number[] = [10, 20, 50, 100]
  description: string = "Seleccione un registro para modificar"
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  static switch: any = 0;
  dataSource: any = [];
  constructor(private dialog: MatDialog,     private teamService: TeamService
  ) { }
  ngOnInit() {

    this.loadExistingTeams();
    this.dataSource.paginator = this.paginator;
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  loadExistingTeams() {
    let data = this.teamService.getTeams();
    
    this.dataSource = new MatTableDataSource<any>(data);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openDialogTeam(data: any, action: any) {
    const dialogConfig = new MatDialogConfig();
    data.action = action;
    dialogConfig.data = data;
    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '57%';
    dialogConfig.height = "fit-content";
    const dialogRef = this.dialog.open(DialogTeam, dialogConfig);

    dialogRef.afterClosed().subscribe((result: any) => {
      if (TeamsComponent.switch == 1) {
        this.ngOnInit();
      }
      TeamsComponent.switch = 0;
    });
  }
  static changeValueDialog(value: any) {
    this.switch = value

  }
}
@Component({
  selector: 'DialogTeam',
  templateUrl: './DialogTeam.html',
  styleUrls: ['./teams.component.scss'],
  standalone: true,
  imports: [SharedModule]  // Asumiendo que usas botones en el diáEscudo
})
export class DialogTeam implements OnInit {
  @ViewChild(TeamsComponent) team: TeamsComponent | undefined;
  actions = {
    new: 'Guardar',
    edit: 'Actualizar',
    delete: 'Eliminar',
  };
  action!: ActionType;
  title: any = null;
  form: FormGroup
  teamData: any = []
  previewUrl: any = null;
  constructor(
    public dialogRef: MatDialogRef<DialogTeam>,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private teamService: TeamService
  ) {
    this.form = this.formBuilder.group({
      teamName: ["", [Validators.required]],
      idTeam: [null]
    });
  }
  ngOnInit() {
    this.action = this.data?.action;
    this.loadExistingTeams();
    switch (this.action) {
      case 'new':
        this.title = 'Crear equipo';
        break;
      case 'edit':
        this.title = 'Editar equipo';
        this.form.setValue({
          teamName: this.data.teamName,
          idTeam: this.data.idTeam
        })
        this.previewUrl = this.data.teamImage || 'assets/flag.png'
        break;
      case 'delete':
        this.title = 'Eliminar equipo';
        break;
    }
  }
  dialogClose() {
    this.dialogRef.close();
  }
  create() {
    if (this.action == 'new' || this.action == 'edit') {
      if (this.form.valid) {

        if (this.action == 'new') {
          try {
            const existTeam = this.teamData.find((team: Team) => team.teamName.toLocaleLowerCase().trim() == this.form.value.teamName.toLocaleLowerCase().trim())
            if (existTeam) {
              this.openSnackBar("Ya existe un equipo con este nombre", "Cerrar", 'error');
            } else {
              const teamData: Team = {
                teamName: this.form.value.teamName.trim(),
                teamImage: this.previewUrl,
                idTeam: new Date().getTime(),
                golesAFavor: 0,
                golesEnContra: 0,
                puntos: 0,
                diferenciaGoles: 0
              };
    
              this.teamService.addteam(teamData);
              this.openSnackBar("Equipo guardado con exito", "Cerrar", 'success');
              TeamsComponent.changeValueDialog(1)
              this.dialogClose();
            }
          } catch (error) {
  
            this.openSnackBar("Error al guardar equipo", "Cerrar", 'error');
          }

        } else {
          try {

            const { golesAFavor, golesEnContra, diferenciaGoles, puntos, teamName } = this.teamService.getTeamById(this.form.value.idTeam);

            const teamData: Team = {
              teamName: this.form.value.teamName.trim(),
              teamImage: this.previewUrl,
              idTeam: this.form.value.idTeam,
              golesAFavor,
              golesEnContra,
              diferenciaGoles,
              puntos,
            };

            if (teamName.toLocaleLowerCase() !== this.form.value.teamName.toLocaleLowerCase()) {
              const existTeam = this.teamData.find((team: Team) => team.teamName.toLocaleLowerCase() == this.form.value.teamName.toLocaleLowerCase())
              if (existTeam) {
                this.openSnackBar("Ya existe un equipo con este nombre", "Cerrar", 'error');
              } else {
                this.teamService.updateTeam(teamData);
                this.openSnackBar("Equipo actualizado con exito", "Cerrar", 'success');
                TeamsComponent.changeValueDialog(1)
                this.dialogClose();
              }
            } else {
              this.teamService.updateTeam(teamData);
              this.openSnackBar("Equipo actualizado con exito", "Cerrar", 'success');
              TeamsComponent.changeValueDialog(1)
              this.dialogClose();
            }
          } catch (error) {
            this.openSnackBar("Error al actualizar equipo", "Cerrar", 'error');
          }
        }
      } else {
        this.openSnackBar("Todos los campos son obligatorios", "Cerrar", 'error');
      }
    } else {
      try {
        this.teamService.removeTeam(this.data);
        this.openSnackBar("Equipo eliminado con exito", "Cerrar", 'success');
        TeamsComponent.changeValueDialog(1)
        this.dialogClose();
      } catch (error) {
        this.openSnackBar("Error al eliminar equipo", "Cerrar", 'error');
      }
    }
  }
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element && element.files && element.files.length) {
      const file = element.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {

    }
  }
  loadExistingTeams() {
    this.teamData = this.teamService.getTeams()
    this.teamService.setTeams(this.teamData);

  }
  openSnackBar(message: string, action: string, type: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type
    });
  }
}
