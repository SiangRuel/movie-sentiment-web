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

}; const icons = [
    "fa-film",
    "fa-video",
    "fa-clapperboard",
    "fa-play",
    "fa-star",
    "fa-ticket"
];

const bg =
    document.getElementById(
        "movieBg"
    );

const items = [];

for (let i = 0; i < 25; i++) {

    const el =
        document.createElement("i");

    const icon =
        icons[
        Math.floor(
            Math.random() *
            icons.length
        )
        ];

    el.className =
        `fa-solid ${icon} movie-icon`;

    bg.appendChild(el);

    items.push({
        el,

        x:
            Math.random() *
            window.innerWidth,

        y:
            Math.random() *
            window.innerHeight,

        dx:
            (Math.random() - 0.5) * 2,

        dy:
            (Math.random() - 0.5) * 2,
    });
}

function animate() {

    items.forEach(item => {

        item.x += item.dx;
        item.y += item.dy;

        if (
            item.x < 0 ||
            item.x >
            window.innerWidth - 50
        ) {
            item.dx *= -1;
        }

        if (
            item.y < 0 ||
            item.y >
            window.innerHeight - 50
        ) {
            item.dy *= -1;
        }

        item.el.style.left =
            item.x + "px";

        item.el.style.top =
            item.y + "px";
    });

    requestAnimationFrame(
        animate
    );
}

animate();