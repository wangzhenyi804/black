package com.blackad.backend.service;

import com.blackad.backend.entity.CodeSlot;
import org.springframework.stereotype.Service;

@Service
public class CodeGenerationService {

    public String generateCode(CodeSlot slot) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!-- BlackAd Code Start -->\n");
        
        if ("Mobile".equalsIgnoreCase(slot.getTerminal()) || "App".equalsIgnoreCase(slot.getTerminal())) {
             sb.append("<div id=\"ba-slot-").append(slot.getId()).append("\"></div>\n");
             sb.append("<script>\n");
             sb.append("(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n");
             sb.append("new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n");
             sb.append("j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n");
             sb.append("'https://ad.blackad.com/m.js?id=").append(slot.getId());
             if (Boolean.TRUE.equals(slot.getIsShielding())) {
                 sb.append("&s=1");
             }
             sb.append("'+dl;f.parentNode.insertBefore(j,f);\n");
             sb.append("})(window,document,'script','BA_DataLayer','").append(slot.getId()).append("');\n");
             sb.append("</script>");
        } else {
            // PC / Banner Default
            sb.append("<script type=\"text/javascript\">\n");
            sb.append("    (function() {\n");
            sb.append("        var s = document.createElement('script');\n");
            sb.append("        s.type = 'text/javascript';\n");
            sb.append("        s.async = true;\n");
            sb.append("        s.src = 'https://ad.blackad.com/show?id=").append(slot.getId());
            if (slot.getWidth() != null && slot.getHeight() != null) {
                sb.append("&w=").append(slot.getWidth()).append("&h=").append(slot.getHeight());
            }
            if (Boolean.TRUE.equals(slot.getIsShielding())) {
                sb.append("&anti=1");
            }
            sb.append("';\n");
            sb.append("        var x = document.getElementsByTagName('script')[0];\n");
            sb.append("        x.parentNode.insertBefore(s, x);\n");
            sb.append("    })();\n");
            sb.append("</script>");
        }
        
        sb.append("\n<!-- BlackAd Code End -->");
        return sb.toString();
    }
}
