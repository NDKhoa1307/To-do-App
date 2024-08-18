export class PageResponseDto {
    constructor(id?: string, username?: string) {
        if (id && username) {
            this.id = id;
            this.username = username;
        } else {
            // No-argument constructor logic (if needed)
            this.id = '';
            this.username = '';
        }
    }

    id: string;
    username: string;
}
