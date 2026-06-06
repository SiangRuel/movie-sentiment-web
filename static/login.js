function login() {

    const user =
        document.getElementById(
            "username"
        ).value;

    const pass =
        document.getElementById(
            "password"
        ).value;

    if (
        user === "user" &&
        pass === "123"
    ) {

        sessionStorage.setItem(
            "user",
            user
        );
        window.location.href = "/dashboard";

    } else {

        alert(
            "帳號或密碼錯誤"
        );

    }
}

document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {

            login();

        }

    }
); window.onload = () => {

    document.getElementById(
        "username"
    ).value = "";

    document.getElementById(
        "password"
    ).value = "";

}; window.onload = () => {

    document.getElementById(
        "username"
    ).value = "";

    document.getElementById(
        "password"
    ).value = "";

};