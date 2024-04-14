export interface User {
    firstName: string,
    lastName: string
    userName: string,
    email: string,
    description: string,
    Password: string,
}

export const tempUser: User = {
    firstName: "John",
    lastName: "Doe",
    userName: "xX_John_Doe_Xx",
    email: "John.Doe@mail.com",
    description: "John Doe is a dynamic individual with a diverse skill set and a passion for excellence. With a background in [industry/field], he brings a unique blend of [skills/traits] to every project he undertakes. Whether he's [activity/task], [activity/task], or [activity/task], John approaches each endeavor with dedication and creativity. His ability to [skill/quality] and [skill/quality] make him a valuable asset to any team. Outside of work, John enjoys [hobbies/interests], [hobbies/interests], and [hobbies/interests]. With a commitment to continuous growth and a drive to succeed, John is poised to make a significant impact in [industry/field]",
    Password: "Passw0rd123"
}