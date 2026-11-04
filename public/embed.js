/**
 * Lady Greener booking widget embed.
 *
 * Usage — drop this on any page of the business's own website:
 *
 *   <div id="ladygreener-widget" data-business="acme-cleaning"></div>
 *   <script src="https://widget.ladygreener.nl/embed.js" async></script>
 *
 * `data-business` is the business slug (not a secret). Lady Greener runs a
 * single business, so the API ignores the value and always serves that one;
 * the attribute is still required to mark the container. Multiple widgets on
 * one page are supported; each container needs its own data-business.
 */
(function () {
    var WIDGET_ORIGIN = (function () {
        // Derived from this script's own src so the same embed.js works
        // whether it's served from a staging or production widget domain,
        // without businesses needing to update their embed snippet.
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || "";
            if (src.indexOf("/embed.js") !== -1) {
                var a = document.createElement("a");
                a.href = src;
                return a.protocol + "//" + a.host;
            }
        }
        return "https://widget.ladygreener.nl";
    })();

    function mount(container) {
        var subdomain = container.getAttribute("data-business");
        if (!subdomain) {
            console.error("[ladygreener-widget] missing data-business attribute");
            return;
        }
        var iframe = document.createElement("iframe");
        iframe.src = WIDGET_ORIGIN + "/book-now/" + encodeURIComponent(subdomain);
        iframe.style.width = "100%";
        iframe.style.border = "0";
        iframe.style.minHeight = "480px";
        iframe.setAttribute("title", "Book a cleaning");
        iframe.setAttribute("loading", "lazy");
        container.appendChild(iframe);
        container.__ladygreenerIframe = iframe;
    }

    // Only Stripe-hosted payment pages may be opened on behalf of the widget.
    function isAllowedCheckoutUrl(raw) {
        try {
            var u = new URL(raw);
            return u.protocol === "https:" && (u.hostname === "stripe.com" || /\.stripe\.com$/.test(u.hostname));
        } catch (e) {
            return false;
        }
    }

    function findIframe(source) {
        var containers = document.querySelectorAll("[data-business]");
        for (var i = 0; i < containers.length; i++) {
            var iframe = containers[i].__ladygreenerIframe;
            if (iframe && iframe.contentWindow === source) return iframe;
        }
        return null;
    }

    window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.source !== "ladygreener-widget") return;
        // Only accept messages from OUR widget origin AND from one of our iframes.
        if (event.origin !== WIDGET_ORIGIN) return;
        var iframe = findIframe(event.source);
        if (!iframe) return;

        if (data.type === "redirect") {
            // Stripe Checkout cannot be shown inside an iframe: navigate the whole tab.
            if (typeof data.url === "string" && isAllowedCheckoutUrl(data.url)) {
                event.source.postMessage({ source: "ladygreener-embed", type: "redirect-ack" }, WIDGET_ORIGIN);
                window.location.assign(data.url);
            }
            return;
        }

        if (data.height) iframe.style.height = data.height + "px";
    });

    function init() {
        var containers = document.querySelectorAll(
            "#ladygreener-widget[data-business], .ladygreener-widget[data-business]"
        );
        for (var i = 0; i < containers.length; i++) mount(containers[i]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
